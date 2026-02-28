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

    // ── Usuario autenticado que va al login → redirigir a su área ──
    if (pathname === "/login" && isAuthenticated) {
        const dest = role === "ADMIN" ? "/admin" : role === "DOCENTE" ? "/docente" : "/alumno";
        return NextResponse.redirect(new URL(dest, req.url));
    }

    // ── Rutas protegidas sin autenticación → login ──
    const needsAuth =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/docente") ||
        pathname.startsWith("/alumno") ||
        pathname.startsWith("/dashboard");

    if (needsAuth && !isAuthenticated) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // ── /dashboard → redirigir al área del rol durante migración ──
    if (isAuthenticated && (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))) {
        const dest = role === "ADMIN" ? "/admin" : role === "DOCENTE" ? "/docente" : "/alumno";
        return NextResponse.redirect(new URL(dest, req.url));
    }

    // ── Protección estricta por rol ──
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/docente") && role !== "DOCENTE") {
        return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/alumno") && role !== "ALUMNO") {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/login",
        "/dashboard/:path*",
        "/admin/:path*",
        "/docente/:path*",
        "/alumno/:path*",
    ],
};
