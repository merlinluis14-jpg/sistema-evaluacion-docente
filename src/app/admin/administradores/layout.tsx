import type { ReactNode } from "react";

import GlobalAdminGate from "../GlobalAdminGate";

export default function AdministradoresLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <GlobalAdminGate>{children}</GlobalAdminGate>;
}
