// Dashboard del Administrador — Sistema de Evaluación Docente UPTX
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  UserCog,
  GraduationCap,
  BookOpen,
  ClipboardList,
  UserPlus,
  Upload,
  Calendar,
  BarChart2,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  const [totalDocentes, totalAlumnos, totalMaterias, totalEvaluaciones, periodoActivo] =
    await Promise.all([
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.student.count({ where: { isActive: true } }),
      prisma.subject.count({ where: { isActive: true } }),
      prisma.evaluation.count(),
      prisma.period.findFirst({ where: { isActive: true } }),
    ]);

  const stats = [
    { label: "Docentes",    value: totalDocentes,    Icon: UserCog,       color: "bg-blue-50 text-blue-700",   border: "border-blue-100" },
    { label: "Alumnos",     value: totalAlumnos,     Icon: GraduationCap, color: "bg-indigo-50 text-indigo-700", border: "border-indigo-100" },
    { label: "Materias",    value: totalMaterias,    Icon: BookOpen,      color: "bg-violet-50 text-violet-700", border: "border-violet-100" },
    { label: "Evaluaciones",value: totalEvaluaciones,Icon: ClipboardList, color: "bg-emerald-50 text-emerald-700",border: "border-emerald-100" },
  ];

  const quickLinks = [
    { href: "/admin/docentes/nuevo",  label: "Nuevo Docente",    Icon: UserPlus  },
    { href: "/admin/alumnos/importar",label: "Importar CSV",     Icon: Upload    },
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
          <p className="text-slate-400 text-sm mt-1">Panel de control del Sistema de Evaluación Docente UPTX</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 ${periodoActivo
            ? "bg-emerald-100 text-emerald-700"
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
          {quickLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <Icon className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
              <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
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
