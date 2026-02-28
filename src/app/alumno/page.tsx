// src/app/alumno/page.tsx — Vista de materias del alumno
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AlumnoPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; error?: string }>;
}) {
    const params = await searchParams;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    // Buscar el Student vinculado a este User
    const student = await prisma.student.findFirst({
        where: { userId },
        include: {
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

    // Periodo activo
    const periodoActivo = await prisma.period.findFirst({ where: { isActive: true } });

    // Evaluaciones ya realizadas por este alumno en el periodo activo
    const evaluacionesHechas = student && periodoActivo
        ? await prisma.evaluation.findMany({
            where: { studentId: student.id, periodId: periodoActivo.id },
            select: { subjectId: true },
        })
        : [];

    const subjectsEvaluadas = new Set(evaluacionesHechas.map((e) => e.subjectId));

    // Todas las materias únicas del alumno (a través de sus grupos)
    const materiasMap = new Map<string, {
        id: string; name: string; code: string; cuatrimestre: number;
        teacher: { name: string; lastName: string };
        career: { code: string };
    }>();

    for (const ge of student?.groups ?? []) {
        for (const gs of ge.group.subjects) {
            const s = gs.subject;
            if (!materiasMap.has(s.id)) {
                materiasMap.set(s.id, {
                    id: s.id, name: s.name, code: s.code, cuatrimestre: s.cuatrimestre,
                    teacher: s.teacher, career: s.career,
                });
            }
        }
    }

    const materias = Array.from(materiasMap.values());
    const totalPendientes = materias.filter((m) => !subjectsEvaluadas.has(m.id)).length;

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Mis Materias</h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {student
                            ? `${student.name} ${student.lastName} · ${student.career.name}`
                            : "Cargando perfil..."}
                    </p>
                </div>
                {periodoActivo && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                        📅 {periodoActivo.name}
                    </div>
                )}
            </div>

            {/* ── Alertas de estado ── */}
            {params.success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    <p className="font-semibold text-sm">¡Evaluación enviada! Gracias por tu participación.</p>
                </div>
            )}
            {params.error === "duplicada" && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <p className="font-semibold text-sm">Ya evaluaste esta materia en el periodo actual.</p>
                </div>
            )}

            {/* ── Sin periodo activo ── */}
            {!periodoActivo && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <p className="text-4xl mb-2">📅</p>
                    <p className="text-amber-700 font-bold">No hay periodo de evaluación activo</p>
                    <p className="text-amber-600 text-sm mt-1">
                        Consulta con tu coordinador el calendario de evaluaciones.
                    </p>
                </div>
            )}

            {/* ── Sin materias asignadas ── */}
            {student && materias.length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                    <p className="text-4xl mb-2">📭</p>
                    <p className="text-slate-500 font-bold">No tienes materias asignadas</p>
                    <p className="text-slate-400 text-sm mt-1">Contacta a tu coordinador para ser asignado a un grupo.</p>
                </div>
            )}

            {/* ── Progreso ── */}
            {materias.length > 0 && periodoActivo && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-slate-500 font-bold mb-1.5">
                            <span>Progreso de evaluación</span>
                            <span>{materias.length - totalPendientes}/{materias.length} completadas</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${((materias.length - totalPendientes) / materias.length) * 100}%` }}
                            />
                        </div>
                    </div>
                    {totalPendientes === 0 ? (
                        <span className="text-emerald-600 font-black text-sm flex-shrink-0">✓ Completo</span>
                    ) : (
                        <span className="text-blue-600 font-black text-sm flex-shrink-0">{totalPendientes} pendiente{totalPendientes !== 1 ? "s" : ""}</span>
                    )}
                </div>
            )}

            {/* ── Grid de materias ── */}
            {materias.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {materias.map((materia) => {
                        const yaEvaluo = subjectsEvaluadas.has(materia.id);
                        return (
                            <div
                                key={materia.id}
                                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${yaEvaluo ? "border-emerald-200 opacity-75" : "border-slate-100 hover:border-blue-200 hover:shadow-md"
                                    }`}
                            >
                                {/* Cabeza */}
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                        {materia.career.code} · C{materia.cuatrimestre}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">{materia.code}</span>
                                </div>

                                {/* Info */}
                                <h3 className="font-black text-slate-800 text-base leading-tight mb-2">{materia.name}</h3>
                                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl mb-4">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                                        {materia.teacher.name[0]}{materia.teacher.lastName[0]}
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">
                                        {materia.teacher.name} {materia.teacher.lastName}
                                    </p>
                                </div>

                                {/* Acción */}
                                {yaEvaluo ? (
                                    <div className="w-full text-center py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold border border-emerald-200">
                                        ✓ Ya evaluaste esta materia
                                    </div>
                                ) : periodoActivo ? (
                                    <Link
                                        href={`/alumno/evaluar/${materia.id}`}
                                        className="block w-full text-center py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-blue-600 transition-all active:scale-95"
                                    >
                                        Evaluar Docente →
                                    </Link>
                                ) : (
                                    <div className="w-full text-center py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-bold cursor-not-allowed">
                                        Sin periodo activo
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
