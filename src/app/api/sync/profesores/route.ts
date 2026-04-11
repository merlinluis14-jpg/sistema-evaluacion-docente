import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { logAdminAction } from "@/lib/adminLog";
import { authOptions } from "@/lib/auth";
import {
  syncCareerCatalogByExternalIds,
  syncGroupAssignmentsByGroup,
  syncGroupCatalogByCareerAndPeriod,
  syncSubjectCatalogByCareer,
  syncTeacherCatalogByCareer,
} from "@/lib/catalogSync";
import { normalizeCareerCode } from "@/lib/careers";
import { getCatalogoAcademicoExterno } from "@/lib/gestorApi";
import {
  prepareAcademicSync,
  syncExternalAssignments,
  syncExternalCareers,
  syncExternalGroups,
  syncExternalSubjects,
  syncExternalTeachers,
} from "@/lib/gestorSync";
import { prisma } from "@/lib/prisma";
import { getSessionRole } from "@/lib/sessionUser";

type SyncRequestBody = {
  syncCatalog?: boolean;
  selectedIds?: number[];
};

type SyncEntityResult = {
  total: number;
  success: number;
  errors: { row: number; identifier: string; reason: string }[];
  deactivatedCount?: number;
  removedCount?: number;
};

function toSyncEntityResult(total: number, success: number): SyncEntityResult {
  return {
    total,
    success,
    errors: [],
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || getSessionRole(session) !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const data = await getCatalogoAcademicoExterno({ activo: true });

    return NextResponse.json({
      total: data.total,
      profesores: data.profesores,
      resumen: data.resumen,
      warnings: data.warnings,
    });
  } catch (error) {
    console.error("Error fetching external academic catalog:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener catalogo academico externo",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || getSessionRole(session) !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const { syncCatalog, selectedIds } = (await req.json()) as SyncRequestBody;
    const [catalog, activePeriod] = await Promise.all([
      getCatalogoAcademicoExterno({ activo: true }),
      prisma.period.findFirst({
        where: { isActive: true },
        select: { id: true, name: true },
      }),
    ]);

    if (!activePeriod) {
      return NextResponse.json(
        {
          message:
            "Debes tener un periodo de evaluacion activo para sincronizar grupos y asignaciones desde el sistema de horarios.",
        },
        { status: 400 },
      );
    }

    const hasExplicitSelection =
      Array.isArray(selectedIds) && selectedIds.length > 0;
    const isPartialSelection =
      hasExplicitSelection && selectedIds.length < catalog.profesores.length;

    if (syncCatalog && isPartialSelection) {
      return NextResponse.json(
        {
          message:
            "La sincronizacion de catalogo completo no se puede ejecutar con una seleccion parcial. Selecciona todos los docentes o desactiva esa opcion.",
        },
        { status: 400 },
      );
    }

    const selectedIdSet = new Set(selectedIds || []);
    const asignacionesToSync = hasExplicitSelection
      ? catalog.asignaciones.filter(
          (asignacion) =>
            asignacion.profesor && selectedIdSet.has(asignacion.profesor.id),
        )
      : catalog.asignaciones;

    if (asignacionesToSync.length === 0) {
      return NextResponse.json(
        {
          message:
            "No se encontraron asignaciones academicas validas para la seleccion actual.",
        },
        { status: 400 },
      );
    }

    const selectedCareerCodes = new Set(
      asignacionesToSync.map((asignacion) =>
        normalizeCareerCode(asignacion.carrera.codigo || ""),
      ),
    );
    const selectedGroupIds = new Set(
      asignacionesToSync.map((asignacion) => asignacion.grupo.id),
    );

    const careersToSync = isPartialSelection
      ? catalog.carreras.filter((career) =>
          selectedCareerCodes.has(normalizeCareerCode(career.codigo || "")),
        )
      : catalog.carreras;
    const groupsToSync = isPartialSelection
      ? catalog.grupos.filter((group) => selectedGroupIds.has(group.id))
      : catalog.grupos;

    const preparation = prepareAcademicSync({
      asignaciones: asignacionesToSync,
      grupos: groupsToSync,
    });

    if (
      preparation.teachers.length === 0 &&
      preparation.subjects.length === 0 &&
      preparation.groups.length === 0 &&
      preparation.assignments.length === 0
    ) {
      return NextResponse.json(
        {
          message:
            "No fue posible preparar datos validos para sincronizar desde la API externa.",
          warnings: [...catalog.warnings, ...preparation.warnings],
        },
        { status: 400 },
      );
    }

    const careerResult = await syncExternalCareers(careersToSync);
    const teacherResult = preparation.teachers.length
      ? await syncExternalTeachers(preparation.teachers)
      : {
          total: 0,
          success: 0,
          warnings: [],
          createdAccounts: 0,
          skippedTeachers: 0,
          importedEmployeeIds: [],
          affectedCareerIds: [],
          teacherIdByExternalId: new Map<number, string>(),
        };
    const subjectResult = preparation.subjects.length
      ? await syncExternalSubjects(
          preparation.subjects,
          teacherResult.teacherIdByExternalId,
        )
      : {
          total: 0,
          success: 0,
          warnings: [],
          skippedSubjects: 0,
          importedSubjectKeys: [],
          affectedCareerIds: [],
          subjectIdByKey: new Map<string, string>(),
        };
    const groupResult = preparation.groups.length
      ? await syncExternalGroups(preparation.groups, activePeriod.name)
      : {
          total: 0,
          success: 0,
          warnings: [],
          skippedGroups: 0,
          importedGroupKeys: [],
          affectedCareerIds: [],
          groupIdByExternalId: new Map<number, string>(),
        };
    const assignmentResult = preparation.assignments.length
      ? await syncExternalAssignments(
          preparation.assignments,
          groupResult.groupIdByExternalId,
          subjectResult.subjectIdByKey,
          teacherResult.teacherIdByExternalId,
        )
      : {
          total: 0,
          success: 0,
          warnings: [],
          skippedAssignments: 0,
          importedAssignmentKeys: [],
        };

    let teacherDeactivatedCount = 0;
    let subjectDeactivatedCount = 0;
    let groupDeactivatedCount = 0;
    let removedGroupAssignments = 0;
    let careerDeactivatedCount = 0;

    if (syncCatalog) {
      careerDeactivatedCount = await syncCareerCatalogByExternalIds({
        importedCareerExternalIds: careerResult.importedCareerExternalIds,
      });

      const careerIdsForSync = [...new Set([
        ...teacherResult.affectedCareerIds,
        ...subjectResult.affectedCareerIds,
        ...groupResult.affectedCareerIds,
      ])];

      teacherDeactivatedCount = await syncTeacherCatalogByCareer({
        careerIds: careerIdsForSync,
        importedEmployeeIds: teacherResult.importedEmployeeIds,
      });
      subjectDeactivatedCount = await syncSubjectCatalogByCareer({
        careerIds: careerIdsForSync,
        importedSubjectKeys: subjectResult.importedSubjectKeys,
      });
      groupDeactivatedCount = await syncGroupCatalogByCareerAndPeriod({
        careerIds: careerIdsForSync,
        period: activePeriod.name,
        importedGroupKeys: groupResult.importedGroupKeys,
      });
      removedGroupAssignments = await syncGroupAssignmentsByGroup({
        groupIds: [...groupResult.groupIdByExternalId.values()],
        importedAssignmentKeys: assignmentResult.importedAssignmentKeys,
      });
    }

    const warnings = [
      ...catalog.warnings,
      ...careerResult.warnings,
      ...preparation.warnings,
      ...teacherResult.warnings,
      ...subjectResult.warnings,
      ...groupResult.warnings,
      ...assignmentResult.warnings,
    ];

    if (syncCatalog) {
      warnings.push(
        "La sincronizacion completa desactiva carreras, docentes, materias y grupos locales que ya no vienen del sistema externo. Las asignaciones de grupo obsoletas administradas por el externo se eliminan para reflejar el catalogo maestro.",
      );
    }

    try {
      await logAdminAction({
        action: "IMPORT",
        entity: "DOCENTE",
        detail:
          `Sincronizacion academica con Gestor de Horarios para el periodo ${activePeriod.name}. ` +
          `Carreras: ${careerResult.success}/${careerResult.total}. ` +
          `Carreras desactivadas: ${careerDeactivatedCount}. ` +
          `Docentes: ${teacherResult.success}/${teacherResult.total}. ` +
          `Materias: ${subjectResult.success}/${subjectResult.total}. ` +
          `Grupos: ${groupResult.success}/${groupResult.total}. ` +
          `Asignaciones: ${assignmentResult.success}/${assignmentResult.total}. ` +
          `Nuevas cuentas: ${teacherResult.createdAccounts}. ` +
          `Docentes omitidos: ${teacherResult.skippedTeachers}. ` +
          `Materias omitidas: ${subjectResult.skippedSubjects}. ` +
          `Grupos omitidos: ${groupResult.skippedGroups}. ` +
          `Asignaciones omitidas: ${assignmentResult.skippedAssignments}. ` +
          `Sync catalogo: ${syncCatalog ? "Si" : "No"}. ` +
          `Docentes desactivados: ${teacherDeactivatedCount}. ` +
          `Materias desactivadas: ${subjectDeactivatedCount}. ` +
          `Grupos desactivados: ${groupDeactivatedCount}. ` +
          `Asignaciones retiradas: ${removedGroupAssignments}.`,
      });
    } catch (loggingError) {
      console.error(
        "Failed to write admin log for academic API sync",
        loggingError,
      );
    }

    return NextResponse.json({
      careers: {
        ...toSyncEntityResult(careerResult.total, careerResult.success),
        deactivatedCount: careerDeactivatedCount,
      },
      teachers: {
        ...toSyncEntityResult(teacherResult.total, teacherResult.success),
        deactivatedCount: teacherDeactivatedCount,
      },
      subjects: {
        ...toSyncEntityResult(subjectResult.total, subjectResult.success),
        deactivatedCount: subjectDeactivatedCount,
      },
      groups: {
        ...toSyncEntityResult(groupResult.total, groupResult.success),
        deactivatedCount: groupDeactivatedCount,
      },
      assignments: {
        ...toSyncEntityResult(
          assignmentResult.total,
          assignmentResult.success,
        ),
        removedCount: removedGroupAssignments,
      },
      warnings,
      createdAccounts: teacherResult.createdAccounts,
      skippedTeachers: teacherResult.skippedTeachers,
      skippedSubjects: subjectResult.skippedSubjects,
      skippedGroups: groupResult.skippedGroups,
      skippedAssignments: assignmentResult.skippedAssignments,
      syncCatalogApplied: Boolean(syncCatalog),
      selectionSummary: {
        teachers: preparation.selectedTeacherCount,
        subjects: preparation.selectedSubjectCount,
        careers: preparation.selectedCareerCount,
        groups: preparation.selectedGroupCount,
        assignments: preparation.selectedAssignmentCount,
      },
    });
  } catch (error) {
    console.error("Error running academic API sync:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Error durante sincronizacion",
      },
      { status: 500 },
    );
  }
}
