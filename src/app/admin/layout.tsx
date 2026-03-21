import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { SidebarNav } from "./SidebarNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
        redirect("/login");
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">


            <aside className="w-60 flex flex-col flex-shrink-0 h-full" style={{ backgroundColor: "#1E3A5F" }}>

                {/* Logo */}
                <div className="px-5 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}>
                            <span className="text-white font-black text-sm">U</span>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-none">UPT Eval</p>
                            <p className="text-blue-300 text-[10px] mt-0.5">Panel Administrador</p>
                        </div>
                    </div>
                </div>

                {/* Nav + Footer — Client Component (necesita usePathname) */}
                <SidebarNav email={session.user.email ?? ""} />

            </aside>


            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

        </div>
    );
}

