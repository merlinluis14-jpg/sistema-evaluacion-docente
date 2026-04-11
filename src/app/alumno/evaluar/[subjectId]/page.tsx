import { prisma } from "@/lib/prisma";
import { createEvaluation } from "@/app/admin/evaluaciones/actions";
import { EvaluationForm } from "./EvaluationForm";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EvaluarPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId: assignmentId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const student = userId
    ? await prisma.student.findUnique({
        where: { userId },
        select: { id: true, careerId: true, isActive: true },
      })
    : null;

  if (!student?.id || !student.isActive || session?.user?.role !== "ALUMNO") {
    redirect("/login");
  }

  const [groupSubject, activePeriod] = await Promise.all([
    prisma.groupSubject.findUnique({
      where: { id: assignmentId },
      include: {
        subject: {
          include: { career: true },
        },
        teacher: true,
        group: {
          select: {
            id: true,
            name: true,
            careerId: true,
          },
        },
      },
    }),
    prisma.period.findFirst({ where: { isActive: true } }),
  ]);

  if (!groupSubject) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">Asignacion no encontrada</h2>
          <Link
            href="/alumno"
            className="mt-4 inline-block font-semibold text-blue-600 hover:underline"
          >
            Volver a mis materias
          </Link>
        </div>
      </div>
    );
  }

  const enrollment = await prisma.groupEnrollment.findFirst({
    where: {
      studentId: student.id,
      groupId: groupSubject.groupId,
    },
    select: { id: true },
  });

  if (
    !groupSubject.subject.isActive ||
    !groupSubject.group.id ||
    groupSubject.group.careerId !== student.careerId ||
    !groupSubject.teacherId ||
    !enrollment
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-rose-100 bg-white p-6 text-center shadow-xl sm:p-10">
          <h2 className="mb-2 text-2xl font-bold text-rose-700">Acceso no disponible</h2>
          <p className="mb-6 text-slate-500">
            Esta materia no pertenece a tu grupo actual o ya no esta disponible para tu cuenta.
          </p>
          <Link
            href="/alumno"
            className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-all hover:bg-slate-700"
          >
            Volver a mis materias
          </Link>
        </div>
      </div>
    );
  }

  if (!activePeriod) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-amber-100 bg-white p-6 text-center shadow-xl sm:p-10">
          <h2 className="mb-2 text-2xl font-bold text-amber-700">Sin período activo</h2>
          <p className="mb-6 text-slate-500">
            No hay un período de evaluación activo en este momento. Solicita al administrador que
            active el período.
          </p>
          <Link
            href="/alumno"
            className="inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition-all hover:bg-blue-700"
          >
            Volver a mis materias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 sm:space-y-6 sm:pb-12">
      <div className="space-y-1 py-2 text-center sm:py-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-blue-900 sm:text-4xl">
          Evaluación Docente
        </h1>
        <p className="break-words text-sm text-slate-500 sm:text-base">
          Instrumento FDA-24.5 - {activePeriod.name}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500">Materia</p>
          <h2 className="break-words text-lg font-bold text-slate-900 sm:text-xl">{groupSubject.subject.name}</h2>
          <p className="mt-0.5 break-words text-xs text-slate-400">
            {groupSubject.subject.career.name} - {groupSubject.subject.code} - Grupo {groupSubject.group.name}
          </p>
        </div>
        <div className="min-w-0 sm:text-right">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500">Docente</p>
          <h3 className="break-words text-base font-bold text-slate-800 sm:text-lg">
            {groupSubject.teacher?.name} {groupSubject.teacher?.lastName}
          </h3>
        </div>
      </div>

      <EvaluationForm
        groupSubjectId={groupSubject.id}
        periodId={activePeriod.id}
        action={createEvaluation}
      />
    </div>
  );
}
