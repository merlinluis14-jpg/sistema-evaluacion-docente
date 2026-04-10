// Layout principal del panel administrador — sidebar colapsable en móvil

import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { requireAdminScope } from "@/lib/adminScope";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const scope = await requireAdminScope();

  if (!scope) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <AdminSidebar userEmail={scope.email ?? ""} isGlobalAdmin={scope.isGlobal} />
      <main className="min-w-0 flex-1 overflow-x-hidden pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
