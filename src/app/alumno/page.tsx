import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LockKeyhole,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAcademicText } from "@/lib/text/academicText";

export const dynamic = "force-dynamic";

type SearchState = { success?: string; error?: string; info?: string };

export default async function AlumnoPage({
  searchParams,
}: {
  searchParams: Promise<SearchState>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const student = await prisma.student.findFirst({
    where: { userId },
    include: {
      user: {
        select: {
          canChangeInitialPassword: true,
        },
      },
      career: true,
      groups: {
        include: {
          group: {
            include: {
              subjects: {
                include: {
                  subject: {
                    include: { teacher: true, career: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
  });

  const completedEvaluations =
    student && activePeriod
      ? await prisma.evaluation.findMany({
          where: {
            studentId: student.id,
            periodId: activePeriod.id,
          },
          select: { subjectId: true },
        })
      : [];

  const completedSubjects = new Set(completedEvaluations.map((evaluation) => evaluation.subjectId));

  const subjectMap = new Map<
    string,
    {
      id: string;
      name: string;
      code: string;
      cuatrimestre: number;
      teacher: { name: string; lastName: string };
      career: { code: string };
    }
  >();

  for (const enrollment of student?.groups ?? []) {
    for (const groupSubject of enrollment.group.subjects) {
      const subject = groupSubject.subject;
      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          id: subject.id,
          name: formatAcademicText(subject.name),
          code: subject.code,
          cuatrimestre: subject.cuatrimestre,
          teacher: subject.teacher,
          career: subject.career,
        });
      }
    }
  }

  const subjects = Array.from(subjectMap.values());
  const pendingCount = subjects.filter((subject) => !completedSubjects.has(subject.id)).length;
  const completedCount = subjects.length - pendingCount;
  const progressPercentage = subjects.length > 0 ? (completedCount / subjects.length) * 100 : 0;
  const groupNames = Array.from(new Set((student?.groups ?? []).map((enrollment) => enrollment.group.name)));
  const sortedSubjects = [...subjects].sort((a, b) => {
    const aDone = completedSubjects.has(a.id);
    const bDone = completedSubjects.has(b.id);
    if (aDone !== bDone) return Number(aDone) - Number(bDone);
    return a.name.localeCompare(b.name, "es");
  });

  const notifications = [
    params.success === "password-actualizada"
      ? {
          key: "password-actualizada",
          icon: CheckCircle2,
          wrapper: "border-emerald-200 bg-emerald-50 text-emerald-800",
          title: "Contraseña actualizada",
          description:
            "Tu nueva contraseña se guardó correctamente. Si la olvidas después, solo un administrador podrá restablecerla.",
        }
      : null,
    params.success && params.success !== "password-actualizada"
      ? {
          key: "evaluacion-enviada",
          icon: CheckCircle2,
          wrapper: "border-emerald-200 bg-emerald-50 text-emerald-800",
          title: "Evaluación enviada",
          description: "Gracias por tu participación. Tu evaluación ya fue registrada correctamente.",
        }
      : null,
    params.info === "password-bloqueada"
      ? {
          key: "password-bloqueada",
          icon: LockKeyhole,
          wrapper: "border-slate-200 bg-slate-50 text-slate-700",
          title: "Cambio personal no disponible",
          description:
            "Ya utilizaste tu cambio personal de contraseña. Si necesitas otra, solicita el restablecimiento al administrador.",
        }
      : null,
    params.error === "duplicada"
      ? {
          key: "duplicada",
          icon: AlertTriangle,
          wrapper: "border-amber-200 bg-amber-50 text-amber-800",
          title: "Materia ya evaluada",
          description: "Ya evaluaste esta materia en el período actual.",
        }
      : null,
    params.error === "acceso"
      ? {
          key: "acceso",
          icon: AlertTriangle,
          wrapper: "border-rose-200 bg-rose-50 text-rose-800",
          title: "Acceso no disponible",
          description: "Esta materia ya no está disponible para tu cuenta o no pertenece a tu grupo actual.",
        }
      : null,
    params.error === "general"
      ? {
          key: "general",
          icon: AlertTriangle,
          wrapper: "border-rose-200 bg-rose-50 text-rose-800",
          title: "No fue posible guardar la evaluación",
          description: "Intenta de nuevo y, si continúa, revisa el período activo.",
        }
      : null,
    params.error === "formulario"
      ? {
          key: "formulario",
          icon: AlertTriangle,
          wrapper: "border-amber-200 bg-amber-50 text-amber-800",
          title: "Formulario incompleto",
          description:
            "Completa todos los reactivos del instrumento con opciones válidas antes de enviar tu evaluación.",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    icon: typeof CheckCircle2;
    wrapper: string;
    title: string;
    description: string;
  }>;

  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 rounded-[2rem] bg-gradient-to-b from-blue-50/70 via-slate-50 to-transparent blur-2xl" />

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.2)] backdrop-blur sm:p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-24 w-24 rounded-full bg-indigo-100/60 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
              Panel del Alumno
            </div>

            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white">
                {student?.name?.[0] ?? "A"}
                {student?.lastName?.[0] ?? ""}
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-black text-slate-800 sm:text-3xl">Mis Materias</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {student
                    ? `${student.name} ${student.lastName} · ${formatAcademicText(student.career.name)}`
                    : "Perfil de alumno sin datos disponibles"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {activePeriod?.name ?? "Sin período activo"}
                  </span>
                  {groupNames.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {groupNames.join(", ")}
                    </span>
                  )}
                  {student && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {student.career.code}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Materias</span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-800">{subjects.length}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Completadas</span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-800">{completedCount}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock3 className="h-4 w-4 text-amber-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Pendientes</span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-800">{pendingCount}</p>
            </div>
          </div>
        </div>

        {subjects.length > 0 && activePeriod && (
          <div className="relative z-10 mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
            <div className="mb-2 flex flex-col gap-1 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>Progreso de evaluación</span>
              <span>
                {completedCount}/{subjects.length} completadas
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200/70">
              <div
                className="h-2.5 rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {notifications.length > 0 && (
        <section className="space-y-3">
          {notifications.map(({ key, icon: Icon, wrapper, title, description }) => (
            <div
              key={key}
              className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start ${wrapper}`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black">{title}</p>
                <p className="mt-1 text-sm">{description}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {student?.user.canChangeInitialPassword && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-700 shadow-sm">
                <LockKeyhole className="h-3.5 w-3.5" />
                Seguridad de Acceso
              </div>
              <p className="mt-3 text-sm font-black text-amber-900">
                Tu contraseña actual es temporal
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Puedes reemplazarla una sola vez desde tu panel. Si decides conservarla ahora,
                después solo el administrador podrá restablecerla.
              </p>
            </div>

            <Link
              href="/alumno/cambiar-contrasena"
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-700"
            >
              Cambiar Contraseña
            </Link>
          </div>
        </section>
      )}

      {!activePeriod && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
          <p className="font-bold text-amber-700">No hay período de evaluación activo</p>
          <p className="mt-1 text-sm text-amber-600">
            Consulta con tu coordinador el calendario de evaluaciones.
          </p>
        </div>
      )}

      {student && subjects.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-sm sm:p-12">
          <p className="font-bold text-slate-500">No tienes materias asignadas</p>
          <p className="mt-1 text-sm text-slate-400">
            {groupNames.length > 0
              ? `Tu grupo actual (${groupNames.join(", ")}) aún no tiene materias enlazadas.`
              : "Contacta a tu coordinador para ser asignado a un grupo."}
          </p>
        </div>
      )}

      {sortedSubjects.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                Materias Disponibles
              </div>
              <h2 className="mt-3 text-xl font-black text-slate-800">
                Evalúa a tus docentes del período actual
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Las tarjetas pendientes aparecen primero para ayudarte a completar la captura con
                mayor rapidez.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {sortedSubjects.map((subject) => {
              const alreadyEvaluated = completedSubjects.has(subject.id);

              return (
                <div
                  key={subject.id}
                  className={`flex h-full flex-col rounded-3xl border p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.18)] transition-all sm:p-6 ${
                    alreadyEvaluated
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-200/80 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_24px_50px_-28px_rgba(59,130,246,0.18)]"
                  }`}
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                        {subject.career.code} · C{subject.cuatrimestre}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${
                          alreadyEvaluated
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                      {alreadyEvaluated ? "Completada" : "Pendiente"}
                    </span>
                  </div>
                    <span className="break-all text-right font-mono text-xs text-slate-400">
                      {subject.code}
                    </span>
                  </div>

                  <h3 className="mb-3 min-w-0 break-words text-lg font-black leading-tight text-slate-800">
                    {subject.name}
                  </h3>

                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {subject.teacher.name[0]}
                      {subject.teacher.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                        Docente
                      </p>
                      <p className="min-w-0 break-words text-sm font-semibold text-slate-700">
                        {subject.teacher.name} {subject.teacher.lastName}
                      </p>
                    </div>
                  </div>

                  {alreadyEvaluated ? (
                    <div className="mt-auto w-full rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-center text-sm font-bold text-emerald-700">
                      Ya evaluaste esta materia
                    </div>
                  ) : activePeriod ? (
                    <Link
                      href={`/alumno/evaluar/${subject.id}`}
                      className="mt-auto block w-full rounded-2xl bg-slate-900 py-3 text-center text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-95"
                    >
                      Evaluar Docente
                    </Link>
                  ) : (
                    <div className="mt-auto w-full cursor-not-allowed rounded-2xl bg-slate-100 py-3 text-center text-sm font-bold text-slate-400">
                      Sin período activo
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
