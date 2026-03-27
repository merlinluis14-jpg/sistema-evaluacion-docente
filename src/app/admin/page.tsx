// Dashboard del Administrador — Sistema de Evaluación Docente UPTX
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ImportDropdown from "@/app/admin/components/ImportDropdown";
import {
  UserCog,
  GraduationCap,
  BookOpen,
  ClipboardList,
  UserPlus,
  Calendar,
  BarChart2,
  AlertTriangle,
  ArrowRight,
  ScrollText,
} from "lucide-react";

const ACTION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  CREATE:     { bg: "bg-emerald-50",  text: "text-emerald-700", label: "Creación"       },
  DELETE:     { bg: "bg-red-50",      text: "text-red-700",     label: "Eliminación"    },
  UPDATE:     { bg: "bg-blue-50",     text: "text-blue-700",    label: "Actualización"  },
  ACTIVATE:   { bg: "bg-amber-50",    text: "text-amber-700",   label: "Activación"     },
  DEACTIVATE: { bg: "bg-slate-100",   text: "text-slate-600",   label: "Desactivación"  },
  IMPORT:     { bg: "bg-violet-50",   text: "text-violet-700",  label: "Importación"    },
};

const ENTITY_STYLES: Record<string, { bg: string; text: string }> = {
  DOCENTE:    { bg: "bg-blue-50",    text: "text-blue-700"    },
  MATERIA:    { bg: "bg-indigo-50",  text: "text-indigo-700"  },
  PERIODO:    { bg: "bg-amber-50",   text: "text-amber-700"   },
  ALUMNO:     { bg: "bg-emerald-50", text: "text-emerald-700" },
  EVALUACION: { bg: "bg-violet-50",  text: "text-violet-700"  },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  const [totalDocentes, totalAlumnos, totalMaterias, totalEvaluaciones, periodoActivo, recentLogs] =
    await Promise.all([
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.student.count({ where: { isActive: true } }),
      prisma.subject.count({ where: { isActive: true } }),
      prisma.evaluation.count(),
      prisma.period.findFirst({ where: { isActive: true } }),
      prisma.adminLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const userIds = [...new Set(recentLogs.map((l: { userId: string }) => l.userId))] as string[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, username: true },
      })
    : [];
  const userMap = new Map(users.map(u => [u.id, u.email ?? u.username ?? "Admin"]));

  const stats = [
    { label: "Docentes",    value: totalDocentes,    Icon: UserCog,       color: "bg-blue-50 text-blue-700",   border: "border-blue-100" },
    { label: "Alumnos",     value: totalAlumnos,     Icon: GraduationCap, color: "bg-indigo-50 text-indigo-700", border: "border-indigo-100" },
    { label: "Materias",    value: totalMaterias,    Icon: BookOpen,      color: "bg-violet-50 text-violet-700", border: "border-violet-100" },
    { label: "Evaluaciones",value: totalEvaluaciones,Icon: ClipboardList, color: "bg-emerald-50 text-emerald-700",border: "border-emerald-100" },
  ];

  const quickLinks = [
    { href: "/admin/docentes/nuevo",  label: "Nuevo Docente",    Icon: UserPlus  },
    { href: "/admin/periodos",        label: "Gestionar Periodos",Icon: Calendar  },
    { href: "/admin/reportes",        label: "Ver Reportes",     Icon: BarChart2 },
  ];

  return (
    <div className="p-8 space-y-8">


      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Dashboard de <span className="text-blue-600">Administración</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Panel de control del Sistema de Evaluación Docente UPTX</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 ${periodoActivo
            ? "bg-blue-50 text-blue-700"
            : "bg-amber-100 text-amber-700"
          }`}
            title={periodoActivo ? `Periodo activo: ${periodoActivo.name}` : "Sin periodo activo"}
        >
          {periodoActivo
            ? `Periodo activo`
            : "Sin periodo activo"}
        </div>
      </div>


      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon, color, border }) => (
          <div key={label} className={`bg-white rounded-2xl p-6 shadow-sm border ${border}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-slate-800">{value}</p>
            <p className="text-sm text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>


      <div>
        <h2 className="text-lg font-bold text-slate-700 mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ href, label, Icon }, i) => (
            <React.Fragment key={href}>
              {i === 1 && <ImportDropdown />}
              <Link
                href={href}
                className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <Icon className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  {label}
                </span>
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>


      {/* Actividad reciente */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-700">Actividad reciente</h2>
          </div>
          <Link
            href="/admin/logs"
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Ver todos los logs <ArrowRight size={12} />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-10 h-10 mb-2 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-400 text-sm">Sin actividad registrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Acción</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Entidad</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Detalle</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentLogs.map(log => {
                  const actionStyle = ACTION_STYLES[log.action] ?? { bg: "bg-slate-100", text: "text-slate-600", label: log.action };
                  const entityStyle = ENTITY_STYLES[log.entity] ?? { bg: "bg-slate-100", text: "text-slate-600" };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="text-sm font-medium text-slate-700">
                          {new Date(log.createdAt).toLocaleDateString("es-MX", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString("es-MX", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${actionStyle.bg} ${actionStyle.text}`}>
                          {actionStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${entityStyle.bg} ${entityStyle.text}`}>
                          {log.entity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600 max-w-xs truncate">
                          {log.detail ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                            <UserCog size={12} className="text-slate-500" />
                          </div>
                          <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">
                            {userMap.get(log.userId) ?? "Sistema"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {!periodoActivo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">No hay periodo de evaluación activo</p>
            <p className="text-amber-600 text-sm mt-0.5">
              Los alumnos no podrán evaluar hasta que actives un periodo.{" "}
              <Link href="/admin/periodos" className="underline font-semibold hover:text-amber-800">
                Ir a Periodos →
              </Link>
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
