// src/types/next-auth.d.ts
// Extensión de tipos de NextAuth para incluir "role" e "id" en session y JWT
// Necesario para que TypeScript no marque error en session.user.role

import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    id: string;
  }
}
