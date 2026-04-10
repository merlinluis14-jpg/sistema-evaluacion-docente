import type { ReactNode } from "react";

import GlobalAdminGate from "../GlobalAdminGate";

export default function GruposLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <GlobalAdminGate>{children}</GlobalAdminGate>;
}
