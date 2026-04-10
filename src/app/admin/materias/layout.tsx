import type { ReactNode } from "react";

import GlobalAdminGate from "../GlobalAdminGate";

export default function MateriasLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <GlobalAdminGate>{children}</GlobalAdminGate>;
}
