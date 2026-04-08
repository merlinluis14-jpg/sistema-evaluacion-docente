import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Calendar, Mail, ShieldCheck, UserCog } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateAdminForm from "./CreateAdminForm";
import AdminAccountControls from "./AdminAccountControls";

export const dynamic = "force-dynamic";

export default async function AdministradoresPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string; id?: string } | undefined)?.role;
  const currentUserId = (session?.user as { id?: string } | undefined)?.id ?? "";

  if (!session || role !== "ADMIN") {
    redirect("/login");
  }

  const [admins, recentAdminLogs] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.adminLog.findMany({
      where: { entity: "ADMIN" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const actorIds = [...new Set(recentAdminLogs.map((log) => log.userId))];
  const actors = actorIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true, username: true },
      })
    : [];
  const actorMap = new Map(actors.map((actor) => [actor.id, actor.email ?? actor.username ?? "Sistema"]));

  const activeAdmins = admins.filter((admin) => admin.isActive).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Gestión de <span className="text-blue-600">Administradores</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Controla las cuentas con acceso al panel administrativo sin afectar el rol de docentes.
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Admins activos</p>
          <p className="text-2xl font-black text-blue-700">{activeAdmins}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <CreateAdminForm />

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">Cuentas Administrativas</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Vista general de accesos administrativos registrados en el sistema.
            </p>
          </div>

          {admins.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <UserCog className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-bold text-slate-500">No hay cuentas administrativas registradas</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate font-bold text-slate-800">
                        {admin.email ?? admin.username ?? "Sin identificador"}
                      </p>
                      {admin.id === currentUserId ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                          Cuenta actual
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {admin.email ? "Acceso por correo" : "Acceso por identificador"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(admin.createdAt).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      admin.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {admin.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <div className="min-w-[220px]">
                    <AdminAccountControls
                      adminId={admin.id}
                      adminLabel={admin.email ?? admin.username ?? admin.id}
                      isCurrent={admin.id === currentUserId}
                      isActive={admin.isActive}
                      isLastActive={admin.isActive && activeAdmins <= 1}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-800">Actividad Reciente de Administradores</h2>
          <p className="mt-1 text-xs text-slate-400">
            Las altas de cuentas administrativas quedan auditadas automáticamente.
          </p>
        </div>

        {recentAdminLogs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-bold text-slate-500">Aún no hay eventos administrativos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Acción</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Detalle</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Autorizo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentAdminLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(log.createdAt).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{log.detail ?? "Sin detalle"}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-500">
                      {actorMap.get(log.userId) ?? "Sistema"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
