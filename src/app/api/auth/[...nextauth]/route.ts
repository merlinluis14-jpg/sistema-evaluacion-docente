// src/app/api/auth/[...nextauth]/route.ts
// Re-exporta el handler de NextAuth usando la config centralizada en /lib/auth.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Re-exportamos authOptions para los getServerSession() en server actions
export { authOptions };