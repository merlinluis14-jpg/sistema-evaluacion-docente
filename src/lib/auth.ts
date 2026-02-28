// src/lib/auth.ts
// Configuración completa de NextAuth con roles tipados
// Sistema de Evaluación Docente — UPTX

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                
                username: { label: "Usuario", type: "text" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                // email para ADMIN/DOCENTE, username (matrícula) para ALUMNO
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: credentials.username },
                            { username: credentials.username },
                        ],
                        isActive: true,
                    },
                });

                if (!user) return null;

                const passwordMatch = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!passwordMatch) return null;

                return {
                    id: user.id,
                    email: user.email ?? user.username ?? "",
                    role: user.role,
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            // propiedades custom solo en el login inicial
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    session: {
        strategy: "jwt",
    },

    secret: process.env.NEXTAUTH_SECRET,
};
