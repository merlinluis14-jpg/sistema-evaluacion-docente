import { randomBytes } from "crypto";

import bcrypt from "bcryptjs";

import { normalizeCareerCode } from "@/lib/careers";
import type {
  AsignacionGrupoExterna,
  CarreraExterna,
  GrupoExterno,
  ProfesorExterno,
} from "@/lib/gestorApi";
import { prisma } from "@/lib/prisma";
import { formatAcademicText } from "@/lib/text/academicText";

type PreparedTeacher = {
  employeeId: string;
  nombre: string;
  apellido: string;
  email: string;
  carreraCode: string;
  tipoDocente: "PA" | "PTC";
  externalTeacherId: number;
  externalUsername: string;
  displayName: string;
};

type PreparedSubject = {
  externalSubjectId: number;
  nombre: string;
  codigo: string;
  cuatrimestre: number;
  carreraCode: string;
  primaryTeacherExternalId: number | null;
};

type PreparedGroup = {
  externalGroupId: number;
  name: string;
  externalCode: string;
  shift: string;
  cuatrimestre: number;
  carreraCode: string;
  isActive: boolean;
};

type PreparedAssignment = {
  externalGroupId: number;
  externalSubjectId: number;
  careerCode: string;
  subjectCode: string;
  teacherExternalId: number | null;
};

export type ExternalCareerSyncResult = {
  total: number;
  success: number;
  warnings: string[];
  importedCareerExternalIds: number[];
};

export type ExternalTeacherSyncResult = {
  total: number;
  success: number;
  warnings: string[];
  createdAccounts: number;
  skippedTeachers: number;
  importedEmployeeIds: string[];
  affectedCareerIds: string[];
  teacherIdByExternalId: Map<number, string>;
};

export type ExternalSubjectSyncResult = {
  total: number;
  success: number;
  warnings: string[];
  skippedSubjects: number;
  importedSubjectKeys: string[];
  affectedCareerIds: string[];
  subjectIdByKey: Map<string, string>;
};

export type ExternalGroupSyncResult = {
  total: number;
  success: number;
  warnings: string[];
  skippedGroups: number;
  importedGroupKeys: string[];
  affectedCareerIds: string[];
  groupIdByExternalId: Map<number, string>;
};

export type ExternalAssignmentSyncResult = {
  total: number;
  success: number;
  warnings: string[];
  skippedAssignments: number;
  importedAssignmentKeys: string[];
};

export type AcademicSyncPreparation = {
  teachers: PreparedTeacher[];
  subjects: PreparedSubject[];
  groups: PreparedGroup[];
  assignments: PreparedAssignment[];
  warnings: string[];
  selectedTeacherCount: number;
  selectedSubjectCount: number;
  selectedCareerCount: number;
  selectedGroupCount: number;
  selectedAssignmentCount: number;
};

export function buildGestorTeacherEmployeeId(
  profesor: Pick<ProfesorExterno, "id"> | { id: number },
) {
  return `GH-${profesor.id}`;
}

function normalizeTeacherPosition(tipoProfesor: string): "PA" | "PTC" {
  return tipoProfesor === "profesor_completo" ? "PTC" : "PA";
}

function generateTemporaryPassword() {
  return `${randomBytes(8).toString("hex")}Aa1!`;
}

function choosePrimaryCareerCode(careerCodes: string[]) {
  const scoreByCareer = new Map<string, number>();

  for (const rawCode of careerCodes) {
    const code = normalizeCareerCode(rawCode || "");
    if (!code) {
      continue;
    }

    scoreByCareer.set(code, (scoreByCareer.get(code) || 0) + 1);
  }

  return [...scoreByCareer.entries()].sort((left, right) => {
    if (left[1] !== right[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0], "es");
  })[0]?.[0];
}

export async function syncExternalCareers(
  carreras: CarreraExterna[],
): Promise<ExternalCareerSyncResult> {
  const warnings: string[] = [];
  const careersByCode = new Map<
    string,
    { externalId: number; code: string; name: string; isActive: boolean }
  >();

  for (const carrera of carreras) {
    const code = normalizeCareerCode(carrera.codigo || "");
    const name = formatAcademicText(carrera.nombre);

    if (!code || !name) {
      warnings.push(
        "Se omitio una carrera externa por datos incompletos (codigo o nombre).",
      );
      continue;
    }

    if (careersByCode.has(code)) {
      warnings.push(
        `La carrera externa ${code} llego duplicada en la respuesta. Solo se conservara una entrada para la sincronizacion local.`,
      );
      continue;
    }

    careersByCode.set(code, {
      externalId: carrera.id,
      code,
      name,
      isActive: carrera.activa ?? true,
    });
  }

  const careersToSync = [...careersByCode.values()].sort((left, right) =>
    left.code.localeCompare(right.code, "es"),
  );

  for (const career of careersToSync) {
    await prisma.career.upsert({
      where: { code: career.code },
      update: {
        externalId: career.externalId,
        name: career.name,
        isActive: career.isActive,
      },
      create: {
        externalId: career.externalId,
        code: career.code,
        name: career.name,
        isActive: career.isActive,
      },
    });
  }

  return {
    total: careersToSync.length,
    success: careersToSync.length,
    warnings,
    importedCareerExternalIds: careersToSync.map((career) => career.externalId),
  };
}

export function prepareAcademicSync({
  asignaciones,
  grupos,
}: {
  asignaciones: AsignacionGrupoExterna[];
  grupos: GrupoExterno[];
}): AcademicSyncPreparation {
  const warnings: string[] = [
    "Se usara un numero de empleado tecnico con formato GH-<id_externo> para conservar una identidad estable del docente entre sincronizaciones.",
    "Si un docente aparece en multiples carreras, su perfil local conservara una carrera primaria para compatibilidad, pero sus asignaciones por grupo quedaran sincronizadas desde el sistema externo.",
    "La evaluacion del alumno se apoyara en la asignacion real grupo-materia-docente. El docente guardado dentro de la materia local se usara solo como referencia catalografica.",
  ];

  const teacherGroups = new Map<
    number,
    {
      profesor: NonNullable<AsignacionGrupoExterna["profesor"]>;
      careerCodes: string[];
    }
  >();
  const subjectMap = new Map<
    string,
    {
      externalSubjectId: number;
      nombre: string;
      codigo: string;
      cuatrimestre: number;
      carreraCode: string;
      teacherCandidates: number[];
    }
  >();
  const groupMap = new Map<number, PreparedGroup>();
  const assignmentMap = new Map<string, PreparedAssignment>();

  for (const grupo of grupos) {
    const carreraCode = normalizeCareerCode(grupo.carrera.codigo || "");
    const groupCode = (grupo.codigo || "").trim().toUpperCase();
    const cuatrimestre = Number(grupo.cuatrimestre);

    if (!carreraCode || !groupCode || Number.isNaN(cuatrimestre)) {
      warnings.push(
        `Se omitio un grupo externo por datos incompletos (${grupo.codigo || "sin_codigo"}).`,
      );
      continue;
    }

    groupMap.set(grupo.id, {
      externalGroupId: grupo.id,
      name: groupCode,
      externalCode: groupCode,
      shift: (grupo.turno || "").trim().toUpperCase(),
      cuatrimestre,
      carreraCode,
      isActive: grupo.activo ?? true,
    });
  }

  for (const asignacion of asignaciones) {
    const carreraCode = normalizeCareerCode(asignacion.carrera.codigo || "");
    const subjectCode = (asignacion.materia.codigo || "").trim().toUpperCase();
    const subjectName = formatAcademicText(asignacion.materia.nombre);
    const cuatrimestre = Number(asignacion.materia.cuatrimestre);

    if (!carreraCode || !subjectCode || !subjectName || Number.isNaN(cuatrimestre)) {
      warnings.push(
        `Se omitio una asignacion externa por datos incompletos de materia (${asignacion.materia.codigo || "sin_codigo"}).`,
      );
      continue;
    }

    if (asignacion.profesor) {
      const email = asignacion.profesor.email?.trim().toLowerCase();
      const nombre = formatAcademicText(asignacion.profesor.nombre);
      const apellido = formatAcademicText(asignacion.profesor.apellido);

      if (!email || !nombre || !apellido) {
        warnings.push(
          `Se omitio el docente ${asignacion.profesor.nombre_completo || asignacion.profesor.username || asignacion.profesor.id} por datos incompletos (email, nombre o apellido).`,
        );
      } else {
        const currentTeacherGroup = teacherGroups.get(asignacion.profesor.id);
        if (!currentTeacherGroup) {
          teacherGroups.set(asignacion.profesor.id, {
            profesor: asignacion.profesor,
            careerCodes: [carreraCode],
          });
        } else {
          currentTeacherGroup.careerCodes.push(carreraCode);
        }
      }
    }

    const subjectKey = `${carreraCode}:${subjectCode}`;
    const currentSubject = subjectMap.get(subjectKey);
    if (!currentSubject) {
      subjectMap.set(subjectKey, {
        externalSubjectId: asignacion.materia.id,
        nombre: subjectName,
        codigo: subjectCode,
        cuatrimestre,
        carreraCode,
        teacherCandidates: asignacion.profesor ? [asignacion.profesor.id] : [],
      });
    } else if (asignacion.profesor) {
      currentSubject.teacherCandidates.push(asignacion.profesor.id);
    }

    if (!groupMap.has(asignacion.grupo.id)) {
      const groupCode = (asignacion.grupo.codigo || "").trim().toUpperCase();
      const groupCuatrimestre = Number(asignacion.grupo.cuatrimestre);

      if (!groupCode || Number.isNaN(groupCuatrimestre)) {
        warnings.push(
          `Se omitio la asignacion ${subjectCode} porque el grupo ${asignacion.grupo.codigo || "sin_codigo"} llego incompleto.`,
        );
        continue;
      }

      groupMap.set(asignacion.grupo.id, {
        externalGroupId: asignacion.grupo.id,
        name: groupCode,
        externalCode: groupCode,
        shift: (asignacion.grupo.turno || "").trim().toUpperCase(),
        cuatrimestre: groupCuatrimestre,
        carreraCode,
        isActive: asignacion.grupo.activo ?? true,
      });
    }

    assignmentMap.set(
      `${asignacion.grupo.id}:${subjectKey}`,
      {
        externalGroupId: asignacion.grupo.id,
        externalSubjectId: asignacion.materia.id,
        careerCode: carreraCode,
        subjectCode,
        teacherExternalId: asignacion.profesor?.id ?? null,
      },
    );
  }

  const teachers: PreparedTeacher[] = [...teacherGroups.entries()]
    .map(([externalTeacherId, group]) => {
      const primaryCareerCode = choosePrimaryCareerCode(group.careerCodes);
      const email = group.profesor.email.trim().toLowerCase();
      const nombre = formatAcademicText(group.profesor.nombre);
      const apellido = formatAcademicText(group.profesor.apellido);

      if (!primaryCareerCode || !email || !nombre || !apellido) {
        warnings.push(
          `Se omitio el docente ${group.profesor.nombre_completo || group.profesor.username || externalTeacherId} por datos incompletos al preparar la sincronizacion.`,
        );
        return null;
      }

      if (new Set(group.careerCodes.map((code) => normalizeCareerCode(code))).size > 1) {
        warnings.push(
          `El docente ${group.profesor.nombre_completo} aparece en multiples carreras externas. Se conservara ${primaryCareerCode} como carrera primaria local, pero sus asignaciones por grupo seguiran activas.`,
        );
      }

      return {
        employeeId: buildGestorTeacherEmployeeId({ id: externalTeacherId }),
        nombre,
        apellido,
        email,
        carreraCode: primaryCareerCode,
        tipoDocente: normalizeTeacherPosition(group.profesor.tipo_profesor),
        externalTeacherId,
        externalUsername: group.profesor.username,
        displayName: group.profesor.nombre_completo || `${nombre} ${apellido}`,
      };
    })
    .filter((teacher): teacher is PreparedTeacher => Boolean(teacher))
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "es"));

  const subjects: PreparedSubject[] = [...subjectMap.values()]
    .map((subject) => {
      const uniqueTeachers = [...new Set(subject.teacherCandidates)].sort((left, right) => left - right);
      if (uniqueTeachers.length > 1) {
        warnings.push(
          `La materia ${subject.codigo} de ${subject.carreraCode} tiene multiples docentes segun el sistema externo. Se definira un docente primario solo para el catalogo, pero las asignaciones por grupo se respetaran de forma exacta.`,
        );
      }

      return {
        externalSubjectId: subject.externalSubjectId,
        nombre: subject.nombre,
        codigo: subject.codigo,
        cuatrimestre: subject.cuatrimestre,
        carreraCode: subject.carreraCode,
        primaryTeacherExternalId: uniqueTeachers[0] ?? null,
      };
    })
    .sort((left, right) =>
      `${left.carreraCode}:${left.codigo}`.localeCompare(
        `${right.carreraCode}:${right.codigo}`,
        "es",
      ),
    );

  const preparedGroups = [...groupMap.values()].sort((left, right) =>
    `${left.carreraCode}:${left.name}`.localeCompare(
      `${right.carreraCode}:${right.name}`,
      "es",
    ),
  );

  const preparedAssignments = [...assignmentMap.values()].sort((left, right) =>
    `${left.externalGroupId}:${left.careerCode}:${left.subjectCode}`.localeCompare(
      `${right.externalGroupId}:${right.careerCode}:${right.subjectCode}`,
      "es",
    ),
  );

  return {
    teachers,
    subjects,
    groups: preparedGroups,
    assignments: preparedAssignments,
    warnings,
    selectedTeacherCount: teachers.length,
    selectedSubjectCount: subjects.length,
    selectedCareerCount: new Set(subjects.map((subject) => subject.carreraCode)).size,
    selectedGroupCount: preparedGroups.length,
    selectedAssignmentCount: preparedAssignments.length,
  };
}

export async function syncExternalTeachers(
  teachers: PreparedTeacher[],
): Promise<ExternalTeacherSyncResult> {
  const warnings: string[] = [];
  const teacherIdByExternalId = new Map<number, string>();
  const importedEmployeeIds: string[] = [];
  const affectedCareerIds = new Set<string>();
  const careerIdByCode = new Map<string, string>();
  let createdAccounts = 0;
  let skippedTeachers = 0;
  let success = 0;

  for (const teacher of teachers) {
    let careerId = careerIdByCode.get(teacher.carreraCode);
    if (!careerId) {
      const career = await prisma.career.findUnique({
        where: { code: teacher.carreraCode },
        select: { id: true },
      });

      if (!career) {
        skippedTeachers++;
        warnings.push(
          `No se pudo sincronizar al docente ${teacher.displayName} porque la carrera ${teacher.carreraCode} no existe localmente.`,
        );
        continue;
      }

      careerId = career.id;
      careerIdByCode.set(teacher.carreraCode, careerId);
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { employeeId: teacher.employeeId },
      include: { user: true },
    });
    const normalizedEmail = teacher.email.toLowerCase();

    if (existingTeacher) {
      const conflictingUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: existingTeacher.userId },
        },
        select: { id: true },
      });

      const userData: {
        email?: string;
        isActive: boolean;
        role: "DOCENTE";
      } = {
        isActive: true,
        role: "DOCENTE",
      };

      if (conflictingUser) {
        warnings.push(
          `El email ${normalizedEmail} ya esta en uso por otra cuenta. Se conservara el email actual del docente ${teacher.displayName}.`,
        );
      } else {
        userData.email = normalizedEmail;
      }

      await prisma.user.update({
        where: { id: existingTeacher.userId },
        data: userData,
      });

      const updatedTeacher = await prisma.teacher.update({
        where: { id: existingTeacher.id },
        data: {
          externalId: teacher.externalTeacherId,
          externalUsername: teacher.externalUsername,
          name: teacher.nombre,
          lastName: teacher.apellido,
          careerId,
          position: teacher.tipoDocente,
          isActive: true,
          managedByExternal: true,
          lastExternalSyncAt: new Date(),
        },
        select: { id: true },
      });

      teacherIdByExternalId.set(teacher.externalTeacherId, updatedTeacher.id);
    } else {
      const providedPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(providedPassword, 10);

      const existingUser = await prisma.user.findFirst({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      let userId = existingUser?.id;
      if (userId) {
        const teacherWithSameUser = await prisma.teacher.findFirst({
          where: { userId },
          select: { id: true },
        });

        if (teacherWithSameUser) {
          skippedTeachers++;
          warnings.push(
            `No se pudo crear al docente ${teacher.displayName} porque el email ${normalizedEmail} ya pertenece a otro docente local.`,
          );
          continue;
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            role: "DOCENTE",
            isActive: true,
          },
        });
      } else {
        const user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            role: "DOCENTE",
            isActive: true,
          },
          select: { id: true },
        });
        userId = user.id;
      }

      const createdTeacher = await prisma.teacher.create({
        data: {
          userId,
          externalId: teacher.externalTeacherId,
          externalUsername: teacher.externalUsername,
          name: teacher.nombre,
          lastName: teacher.apellido,
          employeeId: teacher.employeeId,
          careerId,
          position: teacher.tipoDocente,
          isActive: true,
          managedByExternal: true,
          lastExternalSyncAt: new Date(),
        },
        select: { id: true },
      });

      teacherIdByExternalId.set(teacher.externalTeacherId, createdTeacher.id);
      createdAccounts++;
    }

    importedEmployeeIds.push(teacher.employeeId);
    affectedCareerIds.add(careerId);
    success++;
  }

  return {
    total: teachers.length,
    success,
    warnings,
    createdAccounts,
    skippedTeachers,
    importedEmployeeIds,
    affectedCareerIds: [...affectedCareerIds],
    teacherIdByExternalId,
  };
}

export async function syncExternalSubjects(
  subjects: PreparedSubject[],
  teacherIdByExternalId: Map<number, string>,
): Promise<ExternalSubjectSyncResult> {
  const warnings: string[] = [];
  const subjectIdByKey = new Map<string, string>();
  const importedSubjectKeys: string[] = [];
  const affectedCareerIds = new Set<string>();
  const careerIdByCode = new Map<string, string>();
  let skippedSubjects = 0;
  let success = 0;

  for (const subject of subjects) {
    let careerId = careerIdByCode.get(subject.carreraCode);
    if (!careerId) {
      const career = await prisma.career.findUnique({
        where: { code: subject.carreraCode },
        select: { id: true },
      });

      if (!career) {
        skippedSubjects++;
        warnings.push(
          `No se pudo sincronizar la materia ${subject.codigo} porque la carrera ${subject.carreraCode} no existe localmente.`,
        );
        continue;
      }

      careerId = career.id;
      careerIdByCode.set(subject.carreraCode, careerId);
    }

    const teacherId =
      subject.primaryTeacherExternalId !== null
        ? teacherIdByExternalId.get(subject.primaryTeacherExternalId) ?? null
        : null;

    if (subject.primaryTeacherExternalId !== null && !teacherId) {
      warnings.push(
        `La materia ${subject.codigo} de ${subject.carreraCode} no encontro a su docente primario local. Se guardara sin docente principal y la asignacion real se resolvera por grupo.`,
      );
    }

    const [existingByExternalId, existingByCodeCareer] = await Promise.all([
      prisma.subject.findUnique({
        where: { externalId: subject.externalSubjectId },
        select: { id: true, code: true, careerId: true },
      }),
      prisma.subject.findUnique({
        where: {
          code_careerId: {
            code: subject.codigo,
            careerId,
          },
        },
        select: { id: true, code: true, externalId: true },
      }),
    ]);

    if (
      existingByExternalId &&
      existingByCodeCareer &&
      existingByExternalId.id !== existingByCodeCareer.id
    ) {
      await prisma.subject.update({
        where: { id: existingByExternalId.id },
        data: {
          externalId: null,
        },
      });

      warnings.push(
        `La materia externa ${subject.externalSubjectId} ya estaba enlazada a otro registro local. Se conservara la materia ${subject.codigo} de ${subject.carreraCode} como canonica y se liberara el enlace externo anterior para evitar duplicados.`,
      );
    }

    const subjectData = {
      externalId: subject.externalSubjectId,
      name: subject.nombre,
      code: subject.codigo,
      cuatrimestre: subject.cuatrimestre,
      teacherId,
      careerId,
      isActive: true,
      managedByExternal: true,
      lastExternalSyncAt: new Date(),
    };

    const targetSubjectId =
      existingByCodeCareer?.id ?? existingByExternalId?.id ?? null;

    const syncedSubject = targetSubjectId
      ? await prisma.subject.update({
          where: { id: targetSubjectId },
          data: subjectData,
          select: { id: true, code: true },
        })
      : await prisma.subject.create({
          data: subjectData,
          select: { id: true, code: true },
        });

    importedSubjectKeys.push(`${careerId}:${syncedSubject.code}`);
    affectedCareerIds.add(careerId);
    subjectIdByKey.set(`${subject.carreraCode}:${subject.codigo}`, syncedSubject.id);
    success++;
  }

  return {
    total: subjects.length,
    success,
    warnings,
    skippedSubjects,
    importedSubjectKeys,
    affectedCareerIds: [...affectedCareerIds],
    subjectIdByKey,
  };
}

export async function syncExternalGroups(
  groups: PreparedGroup[],
  periodName: string,
): Promise<ExternalGroupSyncResult> {
  const warnings: string[] = [];
  const groupIdByExternalId = new Map<number, string>();
  const importedGroupKeys: string[] = [];
  const affectedCareerIds = new Set<string>();
  const careerIdByCode = new Map<string, string>();
  let skippedGroups = 0;
  let success = 0;

  for (const group of groups) {
    let careerId = careerIdByCode.get(group.carreraCode);
    if (!careerId) {
      const career = await prisma.career.findUnique({
        where: { code: group.carreraCode },
        select: { id: true },
      });

      if (!career) {
        skippedGroups++;
        warnings.push(
          `No se pudo sincronizar el grupo ${group.name} porque la carrera ${group.carreraCode} no existe localmente.`,
        );
        continue;
      }

      careerId = career.id;
      careerIdByCode.set(group.carreraCode, careerId);
    }

    const existingGroup = await prisma.group.findFirst({
      where: {
        period: periodName,
        OR: [
          { externalId: group.externalGroupId },
          {
            careerId,
            name: {
              equals: group.name,
              mode: "insensitive",
            },
          },
        ],
      },
      select: { id: true },
    });

    const syncedGroup = existingGroup
      ? await prisma.group.update({
          where: { id: existingGroup.id },
          data: {
            name: group.name,
            period: periodName,
            externalId: group.externalGroupId,
            externalCode: group.externalCode,
            shift: group.shift || null,
            cuatrimestre: group.cuatrimestre,
            careerId,
            isActive: group.isActive,
            managedByExternal: true,
            lastExternalSyncAt: new Date(),
          },
          select: { id: true },
        })
      : await prisma.group.create({
          data: {
            name: group.name,
            period: periodName,
            externalId: group.externalGroupId,
            externalCode: group.externalCode,
            shift: group.shift || null,
            cuatrimestre: group.cuatrimestre,
            careerId,
            isActive: group.isActive,
            managedByExternal: true,
            lastExternalSyncAt: new Date(),
          },
          select: { id: true },
        });

    groupIdByExternalId.set(group.externalGroupId, syncedGroup.id);
    importedGroupKeys.push(`${careerId}:${periodName}:${group.externalGroupId}`);
    affectedCareerIds.add(careerId);
    success++;
  }

  return {
    total: groups.length,
    success,
    warnings,
    skippedGroups,
    importedGroupKeys,
    affectedCareerIds: [...affectedCareerIds],
    groupIdByExternalId,
  };
}

export async function syncExternalAssignments(
  assignments: PreparedAssignment[],
  groupIdByExternalId: Map<number, string>,
  subjectIdByKey: Map<string, string>,
  teacherIdByExternalId: Map<number, string>,
): Promise<ExternalAssignmentSyncResult> {
  const warnings: string[] = [];
  const importedAssignmentKeys: string[] = [];
  let skippedAssignments = 0;
  let success = 0;

  for (const assignment of assignments) {
    const groupId = groupIdByExternalId.get(assignment.externalGroupId);
    const subjectId = subjectIdByKey.get(
      `${assignment.careerCode}:${assignment.subjectCode}`,
    );

    if (!groupId || !subjectId) {
      skippedAssignments++;
      warnings.push(
        `No se pudo sincronizar la asignacion ${assignment.subjectCode} del grupo externo ${assignment.externalGroupId} porque falta el grupo o la materia local.`,
      );
      continue;
    }

    const teacherId =
      assignment.teacherExternalId !== null
        ? teacherIdByExternalId.get(assignment.teacherExternalId) ?? null
        : null;

    if (assignment.teacherExternalId !== null && !teacherId) {
      warnings.push(
        `La asignacion ${assignment.subjectCode} del grupo externo ${assignment.externalGroupId} llego con un docente no sincronizado. Se guardara temporalmente sin docente en la relacion del grupo.`,
      );
    }

    await prisma.groupSubject.upsert({
      where: {
        groupId_subjectId: {
          groupId,
          subjectId,
        },
      },
      update: {
        teacherId,
        managedByExternal: true,
        lastExternalSyncAt: new Date(),
      },
      create: {
        groupId,
        subjectId,
        teacherId,
        managedByExternal: true,
        lastExternalSyncAt: new Date(),
      },
    });

    importedAssignmentKeys.push(`${groupId}:${subjectId}`);
    success++;
  }

  return {
    total: assignments.length,
    success,
    warnings,
    skippedAssignments,
    importedAssignmentKeys,
  };
}
