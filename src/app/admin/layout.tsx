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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar userEmail={session.user.email ?? ""} />
      <main className="flex-1 overflow-y-auto min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
