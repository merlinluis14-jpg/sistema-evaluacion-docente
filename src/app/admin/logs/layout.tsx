import type { ReactNode } from "react";

import GlobalAdminGate from "../GlobalAdminGate";

export default function LogsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <GlobalAdminGate>{children}</GlobalAdminGate>;
}
