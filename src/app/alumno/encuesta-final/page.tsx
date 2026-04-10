import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudentPlatformFeedbackState } from "@/lib/platformFeedbackState";
import { PlatformFeedbackForm } from "./PlatformFeedbackForm";
import { createPlatformFeedback } from "./actions";

export const dynamic = "force-dynamic";

type SearchState = {
  error?: string;
};

export default async function EncuestaFinalPage({
  searchParams,
}: {
  searchParams: Promise<SearchState>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const student = userId
    ? await prisma.student.findUnique({
        where: { userId },
        select: { id: true, name: true, lastName: true, isActive: true },
      })
    : null;

  if (!student?.id || !student.isActive || session?.user?.role !== "ALUMNO") {
    redirect("/login");
  }

  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (!activePeriod) {
    redirect("/alumno");
  }

  const feedbackState = await getStudentPlatformFeedbackState(student.id, activePeriod.id);

  if (feedbackState.hasResponse) {
    redirect("/alumno?success=encuesta-final");
  }

  if (!feedbackState.hasCompletedAllEvaluations) {
    redirect("/alumno");
  }

  return (
    <div className="space-y-6 pb-8 sm:space-y-8 sm:pb-12">
      <div className="space-y-2 py-2 text-center sm:py-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
          Cierre de periodo
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Encuesta Final del Sistema
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
          Ya completaste tus evaluaciones docentes. Antes de cerrar el proceso, responde este
          breve cuestionario para evaluar el desempeno general del sistema.
        </p>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50/80 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Informacion importante
            </p>
            <p className="mt-3 text-sm font-bold text-slate-800">
              Este cuestionario evalua la experiencia con el sistema, no al docente.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Tus respuestas se registran de forma anonima para valorar el desempeno de la
              plataforma. El sistema solo usa tu cuenta para evitar respuestas duplicadas en el
              periodo activo.
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-left shadow-sm sm:min-w-[220px]">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
              Periodo
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">{activePeriod.name}</p>
            <p className="mt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
              Alumno
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {student.name} {student.lastName}
            </p>
          </div>
        </div>
      </div>

      {params.error === "formulario" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Completa las cinco preguntas antes de enviar la encuesta final.
        </div>
      )}

      {params.error === "general" && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          No fue posible guardar tu encuesta final. Intenta de nuevo.
        </div>
      )}

      <PlatformFeedbackForm periodId={activePeriod.id} action={createPlatformFeedback} />

      <div className="flex justify-center">
        <Link
          href="/alumno"
          className="text-sm font-bold text-slate-500 transition-colors hover:text-slate-700"
        >
          Volver al panel del alumno
        </Link>
      </div>
    </div>
  );
}
