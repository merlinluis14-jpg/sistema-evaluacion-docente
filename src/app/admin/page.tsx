import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Database,
  GraduationCap,
  ScrollText,
  ShieldCheck,
  UserCog,
  UserPlus,
} from "lucide-react";

import ImportDropdown from "@/app/admin/components/ImportDropdown";
import { getRestrictedCareerIds, requireAdminScope } from "@/lib/adminScope";
import { prisma } from "@/lib/prisma";
import { formatMexicoDate, formatMexicoTime } from "@/lib/timeZone";

const ACTION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  CREATE: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Creación" },
  DELETE: { bg: "bg-red-50", text: "text-red-700", label: "Eliminación" },
  UPDATE: { bg: "bg-blue-50", text: "text-blue-700", label: "Actualización" },
  ACTIVATE: { bg: "bg-amber-50", text: "text-amber-700", label: "Activación" },
  DEACTIVATE: { bg: "bg-slate-100", text: "text-slate-600", label: "Desactivación" },
  IMPORT: { bg: "bg-violet-50", text: "text-violet-700", label: "Importación" },
};

const ENTITY_STYLES: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-blue-50", text: "text-blue-700" },
  DOCENTE: { bg: "bg-blue-50", text: "text-blue-700" },
  MATERIA: { bg: "bg-indigo-50", text: "text-indigo-700" },
  PERIODO: { bg: "bg-amber-50", text: "text-amber-700" },
  ALUMNO: { bg: "bg-emerald-50", text: "text-emerald-700" },
  EVALUACION: { bg: "bg-violet-50", text: "text-violet-700" },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const scope = await requireAdminScope();
  const restrictedCareerIds = getRestrictedCareerIds(scope);

  const teacherWhere = restrictedCareerIds
    ? {
        isActive: true,
        OR: [
          { careerId: { in: restrictedCareerIds } },
          {
            subjects: {
              some: {
                isActive: true,
                careerId: { in: restrictedCareerIds },
              },
            },
          },
        ],
      }
    : { isActive: true };
  const studentWhere = restrictedCareerIds
    ? { isActive: true, careerId: { in: restrictedCareerIds } }
    : { isActive: true };
  const subjectWhere = restrictedCareerIds
    ? { isActive: true, careerId: { in: restrictedCareerIds } }
    : { isActive: true };
  const evaluationWhere = restrictedCareerIds
    ? { subject: { careerId: { in: restrictedCareerIds } } }
    : undefined;

  const [
    totalAdmins,
    totalDocentes,
    totalAlumnos,
    totalMaterias,
    totalEvaluaciones,
    periodoActivo,
    recentLogs,
  ] = await Promise.all([
    scope.isGlobal ? prisma.user.count({ where: { role: "ADMIN", isActive: true } }) : Promise.resolve(0),
    prisma.teacher.count({ where: teacherWhere }),
    prisma.student.count({ where: studentWhere }),
    prisma.subject.count({ where: subjectWhere }),
    prisma.evaluation.count({ where: evaluationWhere }),
    prisma.period.findFirst({ where: { isActive: true } }),
    scope.isGlobal
      ? prisma.adminLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  const userIds = [...new Set(recentLogs.map((log) => log.userId))];
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, username: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user.email ?? user.username ?? "Admin"]));

  const stats = [
    ...(scope.isGlobal
      ? [{
          label: "Admins",
          value: totalAdmins,
          Icon: ShieldCheck,
          panel: "from-slate-50 to-white",
          icon: "bg-slate-100 text-slate-700",
        }]
      : [{
          label: "Carreras",
          value: scope.careerIds.length,
          Icon: BookOpen,
          panel: "from-slate-50 to-white",
          icon: "bg-slate-100 text-slate-700",
        }]),
    {
      label: "Docentes",
      value: totalDocentes,
      Icon: UserCog,
      panel: "from-blue-50 to-white",
      icon: "bg-blue-100 text-blue-700",
    },
    {
      label: "Alumnos",
      value: totalAlumnos,
      Icon: GraduationCap,
      panel: "from-indigo-50 to-white",
      icon: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "Materias",
      value: totalMaterias,
      Icon: BookOpen,
      panel: "from-violet-50 to-white",
      icon: "bg-violet-100 text-violet-700",
    },
    {
      label: "Evaluaciones",
      value: totalEvaluaciones,
      Icon: ClipboardList,
      panel: "from-emerald-50 to-white",
      icon: "bg-emerald-100 text-emerald-700",
    },
  ];

  const quickLinks = scope.isGlobal
    ? [
        { href: "/admin/docentes/nuevo", label: "Nuevo Docente", Icon: UserPlus },
        { href: "/admin/administradores", label: "Administradores", Icon: ShieldCheck },
        { href: "/admin/periodos", label: "Gestionar Períodos", Icon: Calendar },
        { href: "/admin/reportes", label: "Ver Reportes", Icon: BarChart2 },
      ]
    : [
        { href: "/admin/reportes", label: "Ver Reportes", Icon: BarChart2 },
      ];

  const recommendations = [
    {
      title: periodoActivo ? "Período listo para evaluar" : "Activa un período antes de abrir evaluaciones",
      description: periodoActivo
        ? `El período ${periodoActivo.name} ya está disponible para operar.`
        : "Sin un período activo, los alumnos no podrán capturar evaluaciones.",
      tone: periodoActivo ? "emerald" : "amber",
    },
    scope.isGlobal
      ? {
          title: "Carga masiva recomendada",
          description: "Importa primero docentes, luego materias y finalmente alumnos para enlazar mejor los grupos.",
          tone: totalDocentes > 0 && totalMaterias > 0 && totalAlumnos > 0 ? "blue" : "slate",
        }
      : {
          title: "Cobertura por carreras asignadas",
          description: "Este panel solo muestra docentes, materias, alumnos y evaluaciones de las carreras que tienes asignadas.",
          tone: "blue",
        },
    {
      title: totalEvaluaciones > 0 ? "Reportes listos para seguimiento" : "Realiza una prueba de evaluación",
      description: totalEvaluaciones > 0
        ? "Ya puedes revisar resultados por docente, materia, grupo y carrera dentro de tu alcance."
        : "Captura al menos una evaluación de prueba para validar reportes y exportaciones.",
      tone: totalEvaluaciones > 0 ? "blue" : "amber",
    },
    scope.isGlobal
      ? {
          title: totalAdmins > 1 ? "Control administrativo respaldado" : "Agrega una segunda cuenta admin",
          description: totalAdmins > 1
            ? "Ya cuentas con respaldo administrativo y trazabilidad en logs."
            : "Conviene tener otra cuenta autorizada para continuidad operativa y control.",
          tone: totalAdmins > 1 ? "emerald" : "slate",
        }
      : {
          title: "Captura institucional concentrada",
          description: "Desde reportes puedes registrar o importar la evaluación de jefatura solo para tus carreras asignadas.",
          tone: totalEvaluaciones > 0 ? "emerald" : "slate",
        },
  ];

  const tipStyles: Record<string, { card: string; title: string; text: string }> = {
    emerald: {
      card: "border-emerald-100 bg-emerald-50",
      title: "text-emerald-800",
      text: "text-emerald-700",
    },
    amber: {
      card: "border-amber-100 bg-amber-50",
      title: "text-amber-800",
      text: "text-amber-700",
    },
    blue: {
      card: "border-blue-100 bg-blue-50",
      title: "text-blue-800",
      text: "text-blue-700",
    },
    slate: {
      card: "border-slate-100 bg-slate-50",
      title: "text-slate-800",
      text: "text-slate-600",
    },
  };

  return (
    <div className="relative space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-x-6 top-4 -z-10 h-72 rounded-[2rem] bg-gradient-to-b from-blue-50/70 via-slate-50 to-transparent blur-2xl sm:inset-x-10" />

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
        <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-12 h-24 w-24 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              {scope.isGlobal ? "Centro de Operación" : "Panel de Jefatura"}
            </div>

            <h1 className="mt-4 text-3xl font-black text-slate-800">
              {scope.isGlobal ? (
                <>
                  Panel de <span className="text-blue-600">Administración</span>
                </>
              ) : (
                <>
                  Panel de <span className="text-blue-600">Carreras Asignadas</span>
                </>
              )}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {scope.isGlobal
                ? "Supervisa catálogos, captura, reportes y trazabilidad del sistema en una sola vista."
                : "Consulta y captura información institucional solo para las carreras que tienes asignadas."}
            </p>

            {!scope.isGlobal && scope.careers.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {scope.careers.map((career) => (
                  <span
                    key={career.id}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                  >
                    {career.code}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[340px]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Estado del Período</span>
              </div>
              <p className="mt-2 text-lg font-black text-slate-800">
                {periodoActivo ? "Activo" : "Pendiente"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {periodoActivo ? periodoActivo.name : "Necesitas activar uno para capturar"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">
                  {scope.isGlobal ? "Estado del Sistema" : "Alcance Operativo"}
                </span>
              </div>
              <p className="mt-2 text-lg font-black text-slate-800">
                {scope.isGlobal
                  ? totalAdmins > 0 && totalDocentes > 0 && totalAlumnos > 0
                    ? "Operando"
                    : "En configuración"
                  : scope.careerIds.length > 0
                    ? "Activo"
                    : "Sin carreras"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {scope.isGlobal
                  ? "Operación general lista para carga, seguimiento y reportes."
                  : "Tu acceso está limitado a las carreras asignadas por el admin principal."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, Icon, panel, icon }) => (
          <div
            key={label}
            className={`rounded-3xl border border-slate-200/80 bg-gradient-to-br ${panel} p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)]`}
          >
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${icon}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-black text-slate-800">{value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      {!periodoActivo && (
        <div className="flex items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-bold text-amber-800">No hay período de evaluación activo</p>
            <p className="mt-0.5 text-sm text-amber-700">
              Los alumnos no podrán evaluar hasta que actives un período.
            </p>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
              Accesos rápidos
            </div>
            <h2 className="mt-3 text-xl font-black text-slate-800">Operación del panel</h2>
            <p className="mt-1 text-sm text-slate-500">
              {scope.isGlobal
                ? "Atajos para las tareas administrativas más frecuentes dentro del sistema."
                : "Atajos para revisar reportes y capturar evaluación de jefatura en tus carreras."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {scope.isGlobal ? <ImportDropdown /> : null}
          {quickLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-700 transition-colors group-hover:text-blue-700">
                  {label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-slate-700">Recomendaciones de uso</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Sugerencias prácticas para operar el sistema con orden y reducir errores en captura y reportes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          {recommendations.map((item) => {
            const style = tipStyles[item.tone];
            return (
              <div key={item.title} className={`rounded-2xl border p-5 ${style.card}`}>
                <p className={`text-sm font-black ${style.title}`}>{item.title}</p>
                <p className={`mt-1 text-sm leading-relaxed ${style.text}`}>{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {scope.isGlobal ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div>
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-slate-700">Actividad reciente</h2>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Últimos movimientos administrativos registrados por el sistema.
              </p>
            </div>
            <Link
              href="/admin/logs"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition-colors hover:text-blue-800"
            >
              Ver todos los logs
              <ArrowRight size={12} />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-14 text-center">
              <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-400">Sin actividad registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Acción</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Entidad</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Detalle</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLogs.map((log) => {
                    const actionStyle = ACTION_STYLES[log.action] ?? {
                      bg: "bg-slate-100",
                      text: "text-slate-600",
                      label: log.action,
                    };
                    const entityStyle = ENTITY_STYLES[log.entity] ?? {
                      bg: "bg-slate-100",
                      text: "text-slate-600",
                    };

                    return (
                      <tr key={log.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-6 py-3">
                          <div className="text-sm font-medium text-slate-700">
                            {formatMexicoDate(log.createdAt)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatMexicoTime(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${actionStyle.bg} ${actionStyle.text}`}>
                            {actionStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${entityStyle.bg} ${entityStyle.text}`}>
                            {log.entity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-sm truncate text-sm text-slate-600">{log.detail ?? "-"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-500">
                            {userMap.get(log.userId) ?? "Sistema"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
