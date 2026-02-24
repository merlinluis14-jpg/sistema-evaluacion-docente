// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma"; // Importamos el singleton que acabamos de crear

/**
 * Configuración robusta de NextAuth para el Sistema de Evaluación Docente UPTX.
 * Se eliminan los tipos 'any' para cumplir con estándares de calidad de software.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Matrícula", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        // Verificación de integridad y cifrado (RF11)
        if (user && await bcrypt.compare(credentials.password, user.password || "")) {
          return {
            id: user.id,
            name: user.username,
            role: user.role // Atributo extendido mediante src/types/next-auth.d.ts
          } as User;
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // En lugar de 'any', le decimos que 'user' tiene un 'role' de tipo string
        const customUser = user as { role?: string };
        token.role = customUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Le indicamos a TS que session.user es un objeto que puede tener un 'role'
        const customSessionUser = session.user as { role?: string };
        
        // Asignamos el rol desde el token
        customSessionUser.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };