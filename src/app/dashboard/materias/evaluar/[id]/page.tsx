import { prisma } from "@/lib/prisma";
import { createEvaluation } from "../../../evaluaciones/actions";
import { EvaluationForm } from "./EvaluationForm";
import Link from "next/link";

export default async function EvaluatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const subject = await prisma.subject.findUnique({
        where: { id: id },
        include: { teacher: true }
    });

    if (!subject) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Materia no encontrada</h2>
                <Link href="/dashboard/materias" className="text-blue-600 mt-4 inline-block font-semibold hover:underline">
                    Volver a materias
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom flex flex-col items-center">

                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Evaluación Docente</h1>
                    <p className="text-lg text-gray-600">Completa la siguiente encuesta basándote en tu experiencia.</p>
                </div>

                <div className="bg-blue-50/50 p-6 rounded-2xl mb-2 w-full border border-blue-100 flex flex-col md:flex-row gap-6 md:items-center justify-between shadow-sm">
                    <div>
                        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Materia</p>
                        <h2 className="text-2xl font-bold text-gray-900">{subject.name}</h2>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Docente</p>
                        <h3 className="text-xl font-bold text-gray-800">{subject.teacher.name} {subject.teacher.lastName}</h3>
                    </div>
                </div>

                <EvaluationForm
                    subjectId={subject.id}
                    teacherId={subject.teacherId}
                    action={createEvaluation}
                />
            </div>
        </div>
    );
}
