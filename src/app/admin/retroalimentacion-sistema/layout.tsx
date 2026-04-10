import type { ReactNode } from "react";

import GlobalAdminGate from "../GlobalAdminGate";

export default function RetroalimentacionSistemaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <GlobalAdminGate>{children}</GlobalAdminGate>;
}
