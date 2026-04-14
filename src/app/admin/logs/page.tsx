import Link from "next/link";
import { ClipboardList, Filter, Shield, UserCog } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatMexicoDate, formatMexicoTime } from "@/lib/timeZone";
import { fixMojibake } from "@/lib/text/fixMojibake";

export const dynamic = "force-dynamic";

const ACTION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    CREATE: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Creación" },
    DELETE: { bg: "bg-red-50", text: "text-red-700", label: "Eliminación" },
    UPDATE: { bg: "bg-blue-50", text: "text-blue-700", label: "Actualización" },
    ACTIVATE: { bg: "bg-amber-50", text: "text-amber-700", label: "Activación" },
    DEACTIVATE: { bg: "bg-slate-100", text: "text-slate-600", label: "Desactivación" },
    IMPORT: { bg: "bg-violet-50", text: "text-violet-700", label: "Importación" },
    LOGIN: { bg: "bg-cyan-50", text: "text-cyan-700", label: "Acceso exitoso" },
    LOGIN_FAILED: { bg: "bg-rose-50", text: "text-rose-700", label: "Acceso fallido" },
};

const ENTITY_STYLES: Record<string, { bg: string; text: string }> = {
    ADMIN: { bg: "bg-blue-50", text: "text-blue-700" },
    DOCENTE: { bg: "bg-blue-50", text: "text-blue-700" },
    GRUPO: { bg: "bg-cyan-50", text: "text-cyan-700" },
    MATERIA: { bg: "bg-indigo-50", text: "text-indigo-700" },
    PERIODO: { bg: "bg-amber-50", text: "text-amber-700" },
    ALUMNO: { bg: "bg-emerald-50", text: "text-emerald-700" },
    EVALUACION: { bg: "bg-violet-50", text: "text-violet-700" },
};

type LogSearchParams = Promise<{ entity?: string }>;

type AdminLogRow = {
    id: string;
    userId: string;
    action: string;
    entity: string;
    detail: string | null;
    createdAt: Date;
};

export default async function LogsPage({
    searchParams,
}: {
    searchParams: LogSearchParams;
}) {
    const { entity: entityFilter } = await searchParams;

    const logs = await prisma.adminLog.findMany({
        where: entityFilter ? { entity: entityFilter } : {},
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    const userIds = [...new Set(logs.map((log: AdminLogRow) => log.userId))];
    const users = userIds.length
        ? await prisma.user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, email: true, username: true },
          })
        : [];

    const userMap = new Map(
        users.map((user) => [user.id, user.email ?? user.username ?? "Admin"])
    );

    const entities = ["ADMIN", "DOCENTE", "GRUPO", "MATERIA", "PERIODO", "ALUMNO", "EVALUACION"];
    const statActions = ["CREATE", "DELETE", "IMPORT", "LOGIN"];

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">
                        Bitácora de <span className="text-blue-600">Actividad</span>
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Consulta operaciones y accesos administrativos recientes.
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    <Shield size={12} />
                    Auditoría del sistema
                </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <form className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs text-slate-400">
                            Puedes revisar hasta 100 movimientos recientes y filtrar por módulo.
                        </p>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-500">
                            Filtrar por entidad
                        </label>
                        <select
                            name="entity"
                            defaultValue={entityFilter ?? ""}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Todas las entidades</option>
                            {entities.map((entity) => (
                                <option key={entity} value={entity}>
                                    {entity}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-800"
                    >
                        <Filter size={14} />
                        Filtrar
                    </button>
                    {entityFilter ? (
                        <Link
                            href="/admin/logs"
                            className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                        >
                            Limpiar
                        </Link>
                    ) : null}
                </form>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <ClipboardList className="mb-1 h-5 w-5 text-blue-500" />
                    <p className="text-2xl font-black text-blue-700">{logs.length}</p>
                    <p className="mt-0.5 text-xs font-bold text-blue-600">Registros mostrados</p>
                </div>
                {statActions.map((action) => {
                    const count = logs.filter((log: AdminLogRow) => log.action === action).length;
                    const style = ACTION_STYLES[action] ?? ACTION_STYLES.CREATE;

                    return (
                        <div
                            key={action}
                            className={`rounded-2xl border border-slate-100 p-5 shadow-sm ${style.bg}`}
                        >
                            <p className={`text-2xl font-black ${style.text}`}>{count}</p>
                            <p className={`mt-0.5 text-xs font-bold ${style.text}`}>
                                {style.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                    <h2 className="font-bold text-slate-700">Últimos 100 registros</h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                        Ordenados por fecha más reciente
                    </p>
                </div>

                {logs.length === 0 ? (
                    <div className="py-16 text-center">
                        <ClipboardList className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                        <p className="font-bold text-slate-500">No hay registros de acciones</p>
                        <p className="mt-1 text-sm text-slate-400">
                            Las acciones y accesos administrativos aparecerán aquí automáticamente
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                            Cuando el equipo empiece a operar, podrás revisar cambios, accesos y sincronizaciones desde esta bitácora.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Acción
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Entidad
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Detalle
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Usuario
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs.map((log) => {
                                    const actionStyle = ACTION_STYLES[log.action] ?? {
                                        bg: "bg-slate-100",
                                        text: "text-slate-600",
                                        label: log.action,
                                    };
                                    const entityStyle = ENTITY_STYLES[log.entity] ?? {
                                        bg: "bg-slate-100",
                                        text: "text-slate-600",
                                    };

                                    return (
                                        <tr key={log.id} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-700">
                                                    {formatMexicoDate(log.createdAt)}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {formatMexicoTime(log.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${actionStyle.bg} ${actionStyle.text}`}
                                                >
                                                    {actionStyle.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${entityStyle.bg} ${entityStyle.text}`}
                                                >
                                                    {log.entity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="max-w-xs truncate text-sm text-slate-600">
                                                    {fixMojibake(log.detail) || "-"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200">
                                                        <UserCog size={12} className="text-slate-500" />
                                                    </div>
                                                    <span className="max-w-[120px] truncate text-xs font-medium text-slate-500">
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
        </div>
    );
}
