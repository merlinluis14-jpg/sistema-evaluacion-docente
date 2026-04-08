import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { formatAcademicText } from "@/lib/text/academicText";

export const dynamic = "force-dynamic";

const averageFromPositiveValues = (values: number[]) => {
    const validValues = values.filter((value) => value > 0);
    if (validValues.length === 0) return null;
    return validValues.reduce((total, value) => total + value, 0) / validValues.length;
};

const formatAverage = (value: number | null, digits: number) => (
    value === null ? "--" : value.toFixed(digits)
);

export default async function DocentePage() {
    const session = await getServerSession(authOptions);

    let teacher = null;
    if (session?.user?.id) {
        teacher = await prisma.teacher.findFirst({
            where: { user: { id: session.user.id } },
            include: {
                career: true,
                evaluations: {
                    include: { subject: true, period: true },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });
    }

    const allEvaluations = teacher?.evaluations ?? [];
    const totalEvaluations = allEvaluations.length;
    const validEvaluations = allEvaluations.filter((evaluation) => evaluation.fac_item01 > 0);

    const facAvg = formatAverage(
        averageFromPositiveValues(
            validEvaluations
                .map((evaluation) => averageFromPositiveValues([
                    evaluation.fac_item01,
                    evaluation.fac_item02,
                    evaluation.fac_item03,
                    evaluation.fac_item04,
                    evaluation.fac_item05,
                    evaluation.fac_item06,
                    evaluation.fac_item07,
                    evaluation.fac_item08,
                    evaluation.fac_item09,
                    evaluation.fac_item10,
                    evaluation.fac_item11,
                ]))
                .filter((value): value is number => value !== null)
        ),
        2
    );

    const habAvg = formatAverage(
        averageFromPositiveValues(
            validEvaluations
                .map((evaluation) => averageFromPositiveValues([
                    evaluation.hab_item01,
                    evaluation.hab_item02,
                    evaluation.hab_item03,
                    evaluation.hab_item04,
                ]))
                .filter((value): value is number => value !== null)
        ),
        2
    );

    const medAvg = formatAverage(
        averageFromPositiveValues(
            validEvaluations
                .map((evaluation) => averageFromPositiveValues([
                    evaluation.med_item01,
                    evaluation.med_item02,
                    evaluation.med_item03,
                    evaluation.med_item04,
                    evaluation.med_item05,
                    evaluation.med_item06,
                ]))
                .filter((value): value is number => value !== null)
        ),
        2
    );

    const recentEvaluations = allEvaluations.map((evaluation) => ({
        evaluation,
        facScore: formatAverage(averageFromPositiveValues([
            evaluation.fac_item01,
            evaluation.fac_item02,
            evaluation.fac_item03,
            evaluation.fac_item04,
            evaluation.fac_item05,
            evaluation.fac_item06,
            evaluation.fac_item07,
            evaluation.fac_item08,
            evaluation.fac_item09,
            evaluation.fac_item10,
            evaluation.fac_item11,
        ]), 1),
        habScore: formatAverage(averageFromPositiveValues([
            evaluation.hab_item01,
            evaluation.hab_item02,
            evaluation.hab_item03,
            evaluation.hab_item04,
        ]), 1),
        medScore: formatAverage(averageFromPositiveValues([
            evaluation.med_item01,
            evaluation.med_item02,
            evaluation.med_item03,
            evaluation.med_item04,
            evaluation.med_item05,
            evaluation.med_item06,
        ]), 1),
    }));

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 px-4 py-5 duration-500 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
                    Mis <span className="text-blue-600">Resultados</span>
                </h1>
                {teacher ? (
                    <p className="text-sm text-slate-500 sm:text-base">
                        {teacher.name} {teacher.lastName} | {formatAcademicText(teacher.career.name)}
                    </p>
                ) : (
                    <p className="text-sm italic text-slate-400">
                        No se encontró perfil de docente para esta sesión.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Evaluaciones recibidas", value: totalEvaluations.toString(), color: "bg-indigo-50 text-indigo-700" },
                    { label: "Promedio Facilitador", value: facAvg, color: "bg-blue-50 text-blue-700" },
                    { label: "Promedio Habilidades", value: habAvg, color: "bg-emerald-50 text-emerald-700" },
                    { label: "Promedio Medios Did.", value: medAvg, color: "bg-amber-50 text-amber-700" },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-2xl border border-current border-opacity-30 p-4 sm:p-5 ${color}`}>
                        <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
                        <p className="mt-1 text-3xl font-black">{value}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <h2 className="font-bold text-slate-800">Evaluaciones Recientes</h2>
                    <span className="text-xs font-medium text-slate-400">Últimas 10</span>
                </div>

                {allEvaluations.length === 0 ? (
                    <div className="p-8 text-center sm:p-16">
                        <p className="font-medium text-slate-400">Aún no tienes evaluaciones registradas.</p>
                        <p className="mt-1 text-sm text-slate-300">Los alumnos podrán evaluarte cuando el período esté activo.</p>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-100 md:hidden">
                            {recentEvaluations.map(({ evaluation, facScore, habScore, medScore }) => (
                                <div key={evaluation.id} className="space-y-4 px-4 py-4 sm:px-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                {evaluation.period.name}
                                            </p>
                                            <Link
                                                href={`/docente/resultados/${evaluation.subjectId}`}
                                                className="mt-1 block text-sm font-semibold leading-snug text-slate-800 transition-colors hover:text-indigo-600"
                                            >
                                                {formatAcademicText(evaluation.subject.name)}
                                            </Link>
                                        </div>
                                        <span className="flex-shrink-0 text-xs text-slate-400">
                                            {new Date(evaluation.createdAt).toLocaleDateString("es-MX")}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: "Fac.", value: facScore, color: "text-indigo-600" },
                                            { label: "Hab.", value: habScore, color: "text-blue-600" },
                                            { label: "Med.", value: medScore, color: "text-emerald-600" },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} className="rounded-2xl bg-slate-50 px-3 py-2 text-center">
                                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                                                <p className={`mt-1 text-lg font-black ${color}`}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[44rem]">
                                <thead>
                                    <tr className="bg-slate-50/70 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                                        <th className="py-3 pl-6 pr-3">Materia</th>
                                        <th className="px-3 py-3">Período</th>
                                        <th className="px-3 py-3 text-center">Fac.</th>
                                        <th className="px-3 py-3 text-center">Hab.</th>
                                        <th className="px-3 py-3 text-center">Med.</th>
                                        <th className="py-3 pl-3 pr-6">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentEvaluations.map(({ evaluation, facScore, habScore, medScore }) => (
                                        <tr key={evaluation.id} className="transition-colors hover:bg-slate-50/50">
                                            <td className="py-3 pl-6 pr-3 text-sm font-semibold text-slate-800">
                                                <Link href={`/docente/resultados/${evaluation.subjectId}`} className="transition-colors hover:text-indigo-600">
                                                    {formatAcademicText(evaluation.subject.name)}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3 text-xs text-slate-500">{evaluation.period.name}</td>
                                            <td className="px-3 py-3 text-center">
                                                <span className="font-black text-indigo-600">{facScore}</span>
                                                <span className="text-xs text-slate-400">/4</span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className="font-black text-blue-600">{habScore}</span>
                                                <span className="text-xs text-slate-400">/5</span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className="font-black text-emerald-600">{medScore}</span>
                                                <span className="text-xs text-slate-400">/5</span>
                                            </td>
                                            <td className="py-3 pl-3 pr-6 text-xs text-slate-400">
                                                {new Date(evaluation.createdAt).toLocaleDateString("es-MX")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
