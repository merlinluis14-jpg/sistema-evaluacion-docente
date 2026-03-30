import { prisma } from "@/lib/prisma";
import { ClipboardList, Filter, Shield, UserCog } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Mapeo de acciones a colores y etiquetas
const ACTION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    CREATE:     { bg: "bg-emerald-50",  text: "text-emerald-700", label: "Creación"       },
    DELETE:     { bg: "bg-red-50",      text: "text-red-700",     label: "Eliminación"    },
    UPDATE:     { bg: "bg-blue-50",     text: "text-blue-700",    label: "Actualización"  },
    ACTIVATE:   { bg: "bg-amber-50",    text: "text-amber-700",   label: "Activación"     },
    DEACTIVATE: { bg: "bg-slate-100",   text: "text-slate-600",   label: "Desactivación"  },
    IMPORT:     { bg: "bg-violet-50",   text: "text-violet-700",  label: "Importación"    },
};

const ENTITY_STYLES: Record<string, { bg: string; text: string }> = {
    ADMIN:      { bg: "bg-blue-50",    text: "text-blue-700"    },
    DOCENTE:    { bg: "bg-blue-50",    text: "text-blue-700"    },
    MATERIA:    { bg: "bg-indigo-50",  text: "text-indigo-700"  },
    PERIODO:    { bg: "bg-amber-50",   text: "text-amber-700"   },
    ALUMNO:     { bg: "bg-emerald-50", text: "text-emerald-700" },
    EVALUACION: { bg: "bg-violet-50",  text: "text-violet-700"  },
};

export default async function LogsPage({
    searchParams,
}: {
    searchParams: Promise<{ entity?: string }>;
}) {
    const { entity: entityFilter } = await searchParams;

    const logs = await prisma.adminLog.findMany({
        where: entityFilter ? { entity: entityFilter } : {},
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    // Obtener los emails de los users para mostrarlos en vez de IDs
    const userIds = [...new Set(logs.map((l: { userId: string }) => l.userId))] as string[];
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, username: true },
    });
    const userMap = new Map(users.map(u => [u.id, u.email ?? u.username ?? "Admin"]));

    const entidades = ["ADMIN", "DOCENTE", "MATERIA", "PERIODO", "ALUMNO", "EVALUACION"];

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">
                        Registro de <span className="text-blue-600">Acciones</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Historial de operaciones administrativas — RF12
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                    <Shield size={12} />
                    Auditoría del sistema
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <form className="flex gap-3 flex-wrap items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            Filtrar por entidad
                        </label>
                        <select
                            name="entity"
                            defaultValue={entityFilter ?? ""}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        >
                            <option value="">Todas las entidades</option>
                            {entidades.map(e => (
                                <option key={e} value={e}>{e}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all"
                    >
                        <Filter size={14} /> Filtrar
                    </button>
                    {entityFilter && (
                        <Link
                            href="/admin/logs"
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                        >
                            Limpiar
                        </Link>
                    )}
                </form>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <ClipboardList className="w-5 h-5 mb-1 text-blue-500" />
                    <p className="text-2xl font-black text-blue-700">{logs.length}</p>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">Registros mostrados</p>
                </div>
                {["CREATE", "DELETE", "IMPORT"].map(action => {
                    const count = logs.filter((l: { action: string }) => l.action === action).length;
                    const style = ACTION_STYLES[action] ?? ACTION_STYLES.CREATE;
                    return (
                        <div key={action} className={`rounded-2xl border border-slate-100 shadow-sm p-5 ${style.bg}`}>
                            <p className={`text-2xl font-black ${style.text}`}>{count}</p>
                            <p className={`text-xs font-bold ${style.text} mt-0.5`}>{style.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tabla de logs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-700">Últimas 100 acciones</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Ordenadas por fecha más reciente
                    </p>
                </div>

                {logs.length === 0 ? (
                    <div className="text-center py-16">
                        <ClipboardList className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-500">No hay registros de acciones</p>
                        <p className="text-sm text-slate-400 mt-1">
                            Las acciones del admin se registrarán aquí automáticamente
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Acción</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Entidad</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Detalle</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs.map(log => {
                                    const actionStyle = ACTION_STYLES[log.action] ?? { bg: "bg-slate-100", text: "text-slate-600", label: log.action };
                                    const entityStyle = ENTITY_STYLES[log.entity] ?? { bg: "bg-slate-100", text: "text-slate-600" };
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-700">
                                                    {new Date(log.createdAt).toLocaleDateString("es-MX", {
                                                        day: "2-digit", month: "short", year: "numeric",
                                                    })}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {new Date(log.createdAt).toLocaleTimeString("es-MX", {
                                                        hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${actionStyle.bg} ${actionStyle.text}`}>
                                                    {actionStyle.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${entityStyle.bg} ${entityStyle.text}`}>
                                                    {log.entity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm text-slate-600 max-w-xs truncate">
                                                    {log.detail ?? "—"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                                                        <UserCog size={12} className="text-slate-500" />
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">
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
