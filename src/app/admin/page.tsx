// src/app/admin/page.tsx — Dashboard del Administrador con estadísticas reales
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
    { label: "Docentes", value: totalDocentes, icon: "👨🏫", color: "bg-blue-50 text-blue-700", border: "border-blue-100" },
    { label: "Alumnos", value: totalAlumnos, icon: "🎓", color: "bg-indigo-50 text-indigo-700", border: "border-indigo-100" },
    { label: "Materias", value: totalMaterias, icon: "📚", color: "bg-violet-50 text-violet-700", border: "border-violet-100" },
    { label: "Evaluaciones", value: totalEvaluaciones, icon: "📋", color: "bg-emerald-50 text-emerald-700", border: "border-emerald-100" },
  ];

  const quickLinks = [
    { href: "/admin/docentes/nuevo", label: "Nuevo Docente", icon: "➕" },
    { href: "/admin/alumnos/importar", label: "Importar CSV", icon: "📤" },
    { href: "/admin/periodos", label: "Gestionar Periodos", icon: "📅" },
    { href: "/admin/reportes", label: "Ver Reportes", icon: "📊" },
  ];

  return (
    <div className="p-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Dashboard de <span className="text-blue-600">Administración</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">{session?.user.email}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 ${periodoActivo
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
          }`}>
          {periodoActivo
            ? `✓ Periodo activo: ${periodoActivo.name}`
            : "⚠️ Sin periodo activo"}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-2xl p-6 shadow-sm border ${stat.border}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-3xl font-black text-slate-800">{stat.value}</p>
            <p className="text-sm text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Accesos rápidos ── */}
      <div>
        <h2 className="text-lg font-bold text-slate-700 mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Aviso si no hay periodo activo ── */}
      {!periodoActivo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <span className="text-2xl flex-shrink-0">📅</span>
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
