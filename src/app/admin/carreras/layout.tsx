import type { ReactNode } from "react";

import GlobalAdminGate from "../GlobalAdminGate";

export default function CarrerasLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <GlobalAdminGate>{children}</GlobalAdminGate>;
}
