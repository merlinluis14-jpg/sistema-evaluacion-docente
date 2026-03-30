import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AlumnoPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; error?: string }>;
}) {
    const params = await searchParams;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

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

    const activePeriod = await prisma.period.findFirst({
        where: { isActive: true },
    });

    const completedEvaluations = student && activePeriod
        ? await prisma.evaluation.findMany({
            where: {
                studentId: student.id,
                periodId: activePeriod.id,
            },
            select: { subjectId: true },
        })
        : [];

    const completedSubjects = new Set(
        completedEvaluations.map((evaluation) => evaluation.subjectId),
    );

    const subjectMap = new Map<string, {
        id: string;
        name: string;
        code: string;
        cuatrimestre: number;
        teacher: { name: string; lastName: string };
        career: { code: string };
    }>();

    for (const enrollment of student?.groups ?? []) {
        for (const groupSubject of enrollment.group.subjects) {
            const subject = groupSubject.subject;
            if (!subjectMap.has(subject.id)) {
                subjectMap.set(subject.id, {
                    id: subject.id,
                    name: subject.name,
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
    const groupNames = Array.from(
        new Set((student?.groups ?? []).map((enrollment) => enrollment.group.name)),
    );

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Mis Materias</h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {student
                            ? `${student.name} ${student.lastName} · ${student.career.name}`
                            : "Cargando perfil..."}
                    </p>
                </div>

                {activePeriod && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                        {activePeriod.name}
                    </div>
                )}
            </div>

            {params.success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">OK</span>
                    <p className="font-semibold text-sm">
                        Evaluacion enviada. Gracias por tu participacion.
                    </p>
                </div>
            )}

            {params.error === "duplicada" && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">!</span>
                    <p className="font-semibold text-sm">
                        Ya evaluaste esta materia en el periodo actual.
                    </p>
                </div>
            )}

            {params.error === "acceso" && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">!</span>
                    <p className="font-semibold text-sm">
                        Esta materia ya no esta disponible para tu cuenta o no pertenece a tu grupo actual.
                    </p>
                </div>
            )}

            {params.error === "general" && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">!</span>
                    <p className="font-semibold text-sm">
                        No fue posible guardar la evaluacion. Intenta de nuevo y, si continua, revisa el periodo activo.
                    </p>
                </div>
            )}

            {!activePeriod && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <p className="text-amber-700 font-bold">No hay periodo de evaluacion activo</p>
                    <p className="text-amber-600 text-sm mt-1">
                        Consulta con tu coordinador el calendario de evaluaciones.
                    </p>
                </div>
            )}

            {student && subjects.length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                    <p className="text-slate-500 font-bold">No tienes materias asignadas</p>
                    <p className="text-slate-400 text-sm mt-1">
                        {groupNames.length > 0
                            ? `Tu grupo actual (${groupNames.join(", ")}) aun no tiene materias enlazadas.`
                            : "Contacta a tu coordinador para ser asignado a un grupo."}
                    </p>
                </div>
            )}

            {subjects.length > 0 && activePeriod && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-slate-500 font-bold mb-1.5">
                            <span>Progreso de evaluacion</span>
                            <span>{subjects.length - pendingCount}/{subjects.length} completadas</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${((subjects.length - pendingCount) / subjects.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {pendingCount === 0 ? (
                        <span className="text-emerald-600 font-black text-sm flex-shrink-0">Completo</span>
                    ) : (
                        <span className="text-blue-600 font-black text-sm flex-shrink-0">
                            {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            )}

            {subjects.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subjects.map((subject) => {
                        const alreadyEvaluated = completedSubjects.has(subject.id);

                        return (
                            <div
                                key={subject.id}
                                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                                    alreadyEvaluated
                                        ? "border-emerald-200 opacity-75"
                                        : "border-slate-100 hover:border-blue-200 hover:shadow-md"
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                        {subject.career.code} · C{subject.cuatrimestre}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">{subject.code}</span>
                                </div>

                                <h3 className="font-black text-slate-800 text-base leading-tight mb-2">
                                    {subject.name}
                                </h3>

                                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl mb-4">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                                        {subject.teacher.name[0]}
                                        {subject.teacher.lastName[0]}
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">
                                        {subject.teacher.name} {subject.teacher.lastName}
                                    </p>
                                </div>

                                {alreadyEvaluated ? (
                                    <div className="w-full text-center py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold border border-emerald-200">
                                        Ya evaluaste esta materia
                                    </div>
                                ) : activePeriod ? (
                                    <Link
                                        href={`/alumno/evaluar/${subject.id}`}
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
