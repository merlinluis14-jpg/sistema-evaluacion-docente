import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = req.nextUrl;
  const role = token?.role as string | undefined;
  const isAuthenticated = !!token;

  if (pathname.startsWith("/api/import")) {
    const maxBodySize = 5 * 1024 * 1024;
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > maxBodySize) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
  }

  if ((pathname === "/" || pathname === "/login") && isAuthenticated) {
    const destination =
      role === "ADMIN" ? "/admin" : role === "DOCENTE" ? "/docente" : "/alumno";
    return NextResponse.redirect(new URL(destination, req.url));
  }

  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/docente") ||
    pathname.startsWith("/alumno") ||
    pathname.startsWith("/dashboard");

  if (needsAuth && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isAuthenticated && (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))) {
    const destination =
      role === "ADMIN" ? "/admin" : role === "DOCENTE" ? "/docente" : "/alumno";
    return NextResponse.redirect(new URL(destination, req.url));
  }

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
