import type { ReactNode } from "react";

import GlobalAdminGate from "../GlobalAdminGate";

export default function DocentesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <GlobalAdminGate>{children}</GlobalAdminGate>;
}
