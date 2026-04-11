import Link from "next/link";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";

import { createEvaluation } from "@/app/admin/evaluaciones/actions";
import { prisma } from "@/lib/prisma";
import { EvaluationForm } from "./EvaluationForm";

export const dynamic = "force-dynamic";

type EvaluatePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assignmentId?: string }>;
};

type AssignmentWithTeacher = {
  id: string;
  teacher: {
    id: string;
    name: string;
    lastName: string;
  };
  group: {
    id: string;
    name: string;
  };
};

export default async function EvaluatePage({
  params,
  searchParams,
}: EvaluatePageProps) {
  const { id } = await params;
  const { assignmentId } = await searchParams;

  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (!activePeriod) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md rounded-3xl border border-amber-100 bg-white p-10 text-center shadow-xl">
          <div className="mb-4 flex justify-center text-slate-400">
            <CalendarDays size={48} />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-amber-700">
            Sin periodo activo
          </h2>
          <p className="mb-6 text-gray-500">
            No hay un periodo de evaluacion activo. Solicita al administrador
            que active el periodo correspondiente.
          </p>
          <Link
            href="/admin/materias"
            className="inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition-all hover:bg-blue-700"
          >
            Volver a materias
          </Link>
        </div>
      </div>
    );
  }

  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      groups: {
        where: {
          teacherId: { not: null },
          group: {
            isActive: true,
            period: activePeriod.name,
          },
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              lastName: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          group: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!subject) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Materia no encontrada
          </h2>
          <Link
            href="/admin/materias"
            className="mb-4 inline-flex items-center gap-1.5 font-medium text-slate-400 transition-colors hover:text-slate-600"
          >
            <ArrowLeft size={16} /> Volver a materias
          </Link>
        </div>
      </div>
    );
  }

  const assignments: AssignmentWithTeacher[] = subject.groups.flatMap((assignment) =>
    assignment.teacher
      ? [
          {
            id: assignment.id,
            teacher: assignment.teacher,
            group: assignment.group,
          },
        ]
      : [],
  );
  const selectedAssignment = assignmentId
    ? assignments.find((assignment) => assignment.id === assignmentId) ?? null
    : assignments.length === 1
      ? assignments[0]
      : null;

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-blue-900">
              Evaluacion Docente
            </h1>
            <p className="text-gray-500">
              Instrumento FDA-24.5 · {activePeriod.name}
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm">
            <div className="flex justify-center text-amber-500">
              <Users size={42} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              Esta materia no tiene asignaciones activas para el periodo actual
            </h2>
            <p className="text-sm text-slate-500">
              Primero sincroniza grupos y asignaciones desde el sistema de
              horarios para evaluar esta materia dentro del periodo activo.
            </p>
            <Link
              href="/admin/materias"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-slate-700"
            >
              Volver a materias
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedAssignment) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-blue-900">
              Evaluacion Docente
            </h1>
            <p className="text-gray-500">
              Instrumento FDA-24.5 · {activePeriod.name}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
                Materia
              </p>
              <h2 className="text-xl font-bold text-gray-900">{subject.name}</h2>
            </div>
            <p className="text-sm text-slate-600">
              Esta materia aparece en multiples grupos durante el periodo
              activo. Elige la asignacion exacta para continuar.
            </p>
          </div>

          <div className="space-y-3">
            {assignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/admin/materias/evaluar/${subject.id}?assignmentId=${assignment.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
                    Grupo {assignment.group.name}
                  </p>
                  <p className="text-base font-bold text-slate-800">
                    {assignment.teacher.name} {assignment.teacher.lastName}
                  </p>
                </div>
                <span className="text-sm font-bold text-blue-700">
                  Seleccionar
                </span>
              </Link>
            ))}
          </div>

          <Link
            href="/admin/materias"
            className="inline-flex items-center gap-1.5 font-medium text-slate-500 transition-colors hover:text-slate-700"
          >
            <ArrowLeft size={16} /> Volver a materias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-900">
            Evaluacion Docente
          </h1>
          <p className="text-gray-500">
            Instrumento FDA-24.5 · {activePeriod.name}
          </p>
        </div>

        <div className="flex w-full flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
              Materia
            </p>
            <h2 className="text-xl font-bold text-gray-900">{subject.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Grupo {selectedAssignment.group.name}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
              Docente
            </p>
            <h3 className="text-lg font-bold text-gray-800">
              {selectedAssignment.teacher.name}{" "}
              {selectedAssignment.teacher.lastName}
            </h3>
          </div>
        </div>

        <EvaluationForm
          groupSubjectId={selectedAssignment.id}
          periodId={activePeriod.id}
          action={createEvaluation}
        />
      </div>
    </div>
  );
}
