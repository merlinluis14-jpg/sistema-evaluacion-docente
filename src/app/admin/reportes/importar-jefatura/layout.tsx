import type { ReactNode } from "react";

import GlobalAdminGate from "../../GlobalAdminGate";

export default function ImportarJefaturaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <GlobalAdminGate>{children}</GlobalAdminGate>;
}
