// src/middleware.ts
// Middleware: protección de rutas y redirección por rol

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = req.nextUrl;
    const role = token?.role as string | undefined;
    const isAuthenticated = !!token;

    // Protección de APIs contra payloads gigantes (Rate/Size limiting básico)
    if (pathname.startsWith("/api/import")) {
        const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB
        const contentLength = Number(req.headers.get("content-length") || "0");
        if (contentLength > MAX_BODY_SIZE) {
            return NextResponse.json({ error: "Payload too large" }, { status: 413 });
        }
    }

    // Redirige usuarios autenticados a su dashboard si acceden a la raíz o login
    if ((pathname === "/" || pathname === "/login") && isAuthenticated) {
        const dest = role === "ADMIN" ? "/admin" : role === "DOCENTE" ? "/docente" : "/alumno";
        return NextResponse.redirect(new URL(dest, req.url));
    }

    // Validación de acceso a rutas protegidas
    const needsAuth =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/docente") ||
        pathname.startsWith("/alumno") ||
        pathname.startsWith("/dashboard");

    if (needsAuth && !isAuthenticated) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // Manejo de la ruta base del dashboard
    if (isAuthenticated && (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))) {
        const dest = role === "ADMIN" ? "/admin" : role === "DOCENTE" ? "/docente" : "/alumno";
        return NextResponse.redirect(new URL(dest, req.url));
    }

    // Validación estricta de rutas por rol
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/docente") && role !== "DOCENTE") {
        return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/alumno") && role !== "ALUMNO") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/login",
        "/dashboard/:path*",
        "/admin/:path*",
        "/docente/:path*",
        "/alumno/:path*",
        "/api/import/:path*",
    ],
};
