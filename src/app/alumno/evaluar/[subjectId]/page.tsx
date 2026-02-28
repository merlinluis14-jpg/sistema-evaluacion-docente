// src/app/alumno/evaluar/[subjectId]/page.tsx
import { prisma } from "@/lib/prisma";
import { createEvaluation } from "@/app/admin/evaluaciones/actions";
import { EvaluationForm } from "./EvaluationForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EvaluarPage({ params }: { params: Promise<{ subjectId: string }> }) {
    const { subjectId } = await params;

    const [subject, activePeriod] = await Promise.all([
        prisma.subject.findUnique({
            where: { id: subjectId },
            include: { teacher: true, career: true },
        }),
        prisma.period.findFirst({ where: { isActive: true } }),
    ]);

    if (!subject) return (
        <div className="flex justify-center items-center h-64">
            <div className="text-center">
                <p className="text-4xl mb-3">🔍</p>
                <h2 className="text-2xl font-bold text-slate-800">Materia no encontrada</h2>
                <Link href="/alumno" className="text-blue-600 mt-4 inline-block font-semibold hover:underline">
                    ← Volver a mis materias
                </Link>
            </div>
        </div>
    );

    if (!activePeriod) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="max-w-md text-center bg-white rounded-3xl shadow-xl p-10 border border-amber-100">
                <div className="text-5xl mb-4">📅</div>
                <h2 className="text-2xl font-bold text-amber-700 mb-2">Sin periodo activo</h2>
                <p className="text-slate-500 mb-6">
                    No hay un periodo de evaluación activo en este momento. Solicita al administrador que active el periodo.
                </p>
                <Link href="/alumno" className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                    ← Volver a mis materias
                </Link>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Encabezado del instrumento */}
            <div className="text-center space-y-1 py-4">
                <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Evaluación Docente</h1>
                <p className="text-slate-500">Instrumento FDA-24.5 · {activePeriod.name}</p>
            </div>

            {/* Info de materia y docente */}
            <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between shadow-sm">
                <div>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Materia</p>
                    <h2 className="text-xl font-bold text-slate-900">{subject.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{subject.career.name} · {subject.code}</p>
                </div>
                <div className="sm:text-right">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Docente</p>
                    <h3 className="text-lg font-bold text-slate-800">{subject.teacher.name} {subject.teacher.lastName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">No. Empleado: {subject.teacher.employeeId}</p>
                </div>
            </div>

            {/* Formulario con los 33 ítems */}
            <EvaluationForm
                subjectId={subject.id}
                teacherId={subject.teacherId}
                periodId={activePeriod.id}
                action={createEvaluation}
            />
        </div>
    );
}
