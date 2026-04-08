import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DocenteLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string }).role !== "DOCENTE") {
        redirect("/login");
    }

    const navItems = [
        { href: "/docente", label: "Resumen" },
        { href: "/docente/resultados", label: "Mis Resultados" },
    ];

    const displayName = session.user.name || session.user.email || "Docente";

    return (
        <div className="min-h-screen bg-gray-50 lg:flex">
            <aside className="bg-[#0F2A1A] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-shrink-0 lg:flex-col">
                <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600">
                                <span className="text-sm font-black text-white">U</span>
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold leading-none text-white">UPTEX Eval</p>
                                <p className="mt-0.5 text-[10px] text-emerald-400">Portal Docente</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 lg:hidden">
                            <div className="max-w-[12rem] text-right">
                                <p className="truncate text-xs font-bold text-white">{displayName}</p>
                                <p className="mt-0.5 text-[10px] text-emerald-400">Solo lectura</p>
                            </div>
                            <SignOutButton className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white">
                                Salir
                            </SignOutButton>
                        </div>
                    </div>
                </div>

                <div className="border-b border-white/10 px-4 py-3 sm:px-5">
                    <p className="truncate text-xs font-bold text-white">{displayName}</p>
                    <p className="mt-0.5 text-[10px] text-emerald-400">Solo lectura</p>
                </div>

                <nav className="overflow-x-auto px-4 py-3 scrollbar-hide sm:px-5 lg:flex-1 lg:px-3 lg:py-4">
                    <div className="flex gap-2 lg:flex-col lg:gap-0.5">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                            >
                                <span className="whitespace-nowrap">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </nav>

                <div className="px-4 pb-4 lg:hidden">
                    <div className="rounded-xl bg-white/5 px-4 py-3">
                        <p className="text-[11px] leading-relaxed text-slate-300">
                            Los resultados son anónimos. No puedes identificar a los alumnos que te evaluaron.
                        </p>
                    </div>
                </div>

                <div className="mx-3 mb-3 hidden rounded-xl bg-white/5 px-4 py-3 lg:block">
                    <p className="text-[10px] leading-relaxed text-slate-400">
                        Los resultados son anónimos. No puedes identificar a los alumnos que te evaluaron.
                    </p>
                </div>

                <div className="hidden space-y-2 border-t border-white/10 px-4 py-4 lg:block">
                    <p className="truncate text-[10px] text-slate-500">{session.user.email}</p>
                    <SignOutButton className="cursor-pointer border-none bg-transparent p-0 text-xs font-medium text-slate-400 transition-colors hover:text-red-400">
                        Cerrar sesión
                    </SignOutButton>
                </div>
            </aside>

            <main className="min-w-0 flex-1 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
