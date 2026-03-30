// Layout principal del panel administrador — sidebar colapsable en móvil

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[100svh] bg-slate-50 overflow-hidden md:h-screen">
      <AdminSidebar userEmail={session.user.email ?? ""} />
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
