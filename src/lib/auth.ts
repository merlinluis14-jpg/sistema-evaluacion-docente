import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type AuthUserLike = {
    id?: string | null;
    email?: string | null;
    role?: string | null;
};

async function logAdminAccessEvent({
    userId,
    action,
    identifier,
}: {
    userId?: string | null;
    action: "LOGIN" | "LOGIN_FAILED";
    identifier: string;
}) {
    if (!userId) {
        return;
    }

    try {
        await prisma.adminLog.create({
            data: {
                userId,
                action,
                entity: "ADMIN",
                entityId: userId,
                detail: `${action === "LOGIN" ? "Acceso administrativo exitoso" : "Intento fallido de acceso administrativo"}: ${identifier}`,
            },
        });
    } catch (error) {
        console.error("No fue posible registrar el acceso administrativo:", error);
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Usuario", type: "text" },
                password: { label: "Contrasena", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

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

                if (!passwordMatch) {
                    if (user.role === "ADMIN") {
                        await logAdminAccessEvent({
                            userId: user.id,
                            action: "LOGIN_FAILED",
                            identifier: user.email ?? user.username ?? credentials.username,
                        });
                    }
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email ?? user.username ?? "",
                    role: user.role,
                };
            },
        }),
    ],

    callbacks: {
        async signIn({ user }) {
            const authUser = user as AuthUserLike;

            if (authUser.role === "ADMIN") {
                await logAdminAccessEvent({
                    userId: authUser.id,
                    action: "LOGIN",
                    identifier: authUser.email ?? authUser.id ?? "admin",
                });
            }

            return true;
        },

        async jwt({ token, user }) {
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
