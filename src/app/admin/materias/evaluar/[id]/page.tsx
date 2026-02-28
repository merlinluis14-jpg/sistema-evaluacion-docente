import { prisma } from "@/lib/prisma";
import { createEvaluation } from "@/app/admin/evaluaciones/actions";
import { EvaluationForm } from "./EvaluationForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EvaluatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [subject, activePeriod] = await Promise.all([
        prisma.subject.findUnique({
            where: { id },
            include: { teacher: true }
        }),
        prisma.period.findFirst({
            where: { isActive: true }
        })
    ]);

    if (!subject) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Materia no encontrada</h2>
                <Link href="/admin/materias" className="text-blue-600 mt-4 inline-block font-semibold hover:underline">
                    Volver a materias
                </Link>
            </div>
        </div>
    );

    if (!activePeriod) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-8">
            <div className="max-w-md text-center bg-white rounded-3xl shadow-xl p-10 border border-amber-100">
                <div className="text-5xl mb-4">📅</div>
                <h2 className="text-2xl font-bold text-amber-700 mb-2">Sin periodo activo</h2>
                <p className="text-gray-500 mb-6">
                    No hay un periodo de evaluación activo. Solicita al administrador que active el periodo correspondiente.
                </p>
                <Link href="/admin/materias" className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                    ← Volver a materias
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-1">
                    <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Evaluación Docente</h1>
                    <p className="text-gray-500">Instrumento FDA-24.5 · {activePeriod.name}</p>
                </div>

                <div className="bg-blue-50/50 p-5 rounded-2xl w-full border border-blue-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Materia</p>
                        <h2 className="text-xl font-bold text-gray-900">{subject.name}</h2>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Docente</p>
                        <h3 className="text-lg font-bold text-gray-800">{subject.teacher.name} {subject.teacher.lastName}</h3>
                    </div>
                </div>

                <EvaluationForm
                    subjectId={subject.id}
                    teacherId={subject.teacherId}
                    periodId={activePeriod.id}
                    action={createEvaluation}
                />
            </div>
        </div>
    );
}
