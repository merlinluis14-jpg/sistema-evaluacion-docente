import type { ReactNode } from "react";

import { requireGlobalAdminScope } from "@/lib/adminScope";

export default async function GlobalAdminGate({
  children,
}: {
  children: ReactNode;
}) {
  await requireGlobalAdminScope();
  return <>{children}</>;
}
