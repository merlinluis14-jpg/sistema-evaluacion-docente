import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AlumnoPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; error?: string; info?: string }>;
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
        <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-black text-slate-800">Mis Materias</h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {student
                            ? `${student.name} ${student.lastName} | ${student.career.name}`
                            : "Cargando perfil..."}
                    </p>
                </div>

                {activePeriod && (
                    <div className="self-start rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                        {activePeriod.name}
                    </div>
                )}
            </div>

            {params.success && (
                <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 sm:flex-row sm:items-center">
                    <span className="text-xl">OK</span>
                    <p className="text-sm font-semibold">
                        {params.success === "password-actualizada"
                            ? "Tu nueva contrasena se guardo correctamente. A partir de ahora solo un administrador podra restablecerla si la olvidas."
                            : "Evaluacion enviada. Gracias por tu participacion."}
                    </p>
                </div>
            )}

            {params.info === "password-bloqueada" && (
                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700 sm:flex-row sm:items-center">
                    <span className="text-xl">i</span>
                    <p className="text-sm font-semibold">
                        Ya utilizaste tu cambio personal de contrasena. Si necesitas otra, solicita el restablecimiento al administrador.
                    </p>
                </div>
            )}

            {student?.user.canChangeInitialPassword && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-black text-amber-800">
                                Tu contrasena actual es temporal
                            </p>
                            <p className="mt-1 text-sm text-amber-700">
                                Puedes reemplazarla una sola vez desde tu panel. Si decides conservarla ahora, despues solo el administrador podra restablecerla.
                            </p>
                        </div>
                        <Link
                            href="/alumno/cambiar-contrasena"
                            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-700"
                        >
                            Cambiar contrasena
                        </Link>
                    </div>
                </div>
            )}

            {params.error === "duplicada" && (
                <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 sm:flex-row sm:items-center">
                    <span className="text-xl">!</span>
                    <p className="text-sm font-semibold">
                        Ya evaluaste esta materia en el periodo actual.
                    </p>
                </div>
            )}

            {params.error === "acceso" && (
                <div className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 sm:flex-row sm:items-center">
                    <span className="text-xl">!</span>
                    <p className="text-sm font-semibold">
                        Esta materia ya no esta disponible para tu cuenta o no pertenece a tu grupo actual.
                    </p>
                </div>
            )}

            {params.error === "general" && (
                <div className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 sm:flex-row sm:items-center">
                    <span className="text-xl">!</span>
                    <p className="text-sm font-semibold">
                        No fue posible guardar la evaluacion. Intenta de nuevo y, si continua, revisa el periodo activo.
                    </p>
                </div>
            )}

            {!activePeriod && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <p className="font-bold text-amber-700">No hay periodo de evaluacion activo</p>
                    <p className="mt-1 text-sm text-amber-600">
                        Consulta con tu coordinador el calendario de evaluaciones.
                    </p>
                </div>
            )}

            {student && subjects.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-12">
                    <p className="font-bold text-slate-500">No tienes materias asignadas</p>
                    <p className="mt-1 text-sm text-slate-400">
                        {groupNames.length > 0
                            ? `Tu grupo actual (${groupNames.join(", ")}) aun no tiene materias enlazadas.`
                            : "Contacta a tu coordinador para ser asignado a un grupo."}
                    </p>
                </div>
            )}

            {subjects.length > 0 && activePeriod && (
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
                    <div className="w-full min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-col gap-1 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>Progreso de evaluacion</span>
                            <span>{subjects.length - pendingCount}/{subjects.length} completadas</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                            <div
                                className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                                style={{ width: `${((subjects.length - pendingCount) / subjects.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {pendingCount === 0 ? (
                        <span className="text-sm font-black text-emerald-600 sm:flex-shrink-0">Completo</span>
                    ) : (
                        <span className="text-sm font-black text-blue-600 sm:flex-shrink-0">
                            {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            )}

            {subjects.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {subjects.map((subject) => {
                        const alreadyEvaluated = completedSubjects.has(subject.id);

                        return (
                            <div
                                key={subject.id}
                                className={`flex h-full flex-col rounded-2xl border p-5 shadow-sm transition-all sm:p-6 ${
                                    alreadyEvaluated
                                        ? "border-emerald-200 opacity-75"
                                        : "border-slate-100 hover:border-blue-200 hover:shadow-md"
                                }`}
                            >
                                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                                        {subject.career.code} | C{subject.cuatrimestre}
                                    </span>
                                    <span className="break-all text-right font-mono text-xs text-slate-400">{subject.code}</span>
                                </div>

                                <h3 className="mb-2 min-w-0 break-words text-base font-black leading-tight text-slate-800">
                                    {subject.name}
                                </h3>

                                <div className="mb-4 flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 sm:items-center">
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                        {subject.teacher.name[0]}
                                        {subject.teacher.lastName[0]}
                                    </div>
                                    <p className="min-w-0 break-words text-sm font-semibold text-slate-700">
                                        {subject.teacher.name} {subject.teacher.lastName}
                                    </p>
                                </div>

                                {alreadyEvaluated ? (
                                    <div className="mt-auto w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-center text-sm font-bold text-emerald-600">
                                        Ya evaluaste esta materia
                                    </div>
                                ) : activePeriod ? (
                                    <Link
                                        href={`/alumno/evaluar/${subject.id}`}
                                        className="mt-auto block w-full rounded-xl bg-slate-900 py-2.5 text-center text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-95"
                                    >
                                        Evaluar Docente
                                    </Link>
                                ) : (
                                    <div className="mt-auto w-full cursor-not-allowed rounded-xl bg-slate-100 py-2.5 text-center text-sm font-bold text-slate-400">
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
