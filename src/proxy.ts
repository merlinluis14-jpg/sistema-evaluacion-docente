import { default as nextAuthMiddleware } from "next-auth/middleware";

export default nextAuthMiddleware;

export const config = {
    // Aquí pones todas las rutas que quieres proteger
    matcher: ["/dashboard/:path*", "/admin/:path*"],
};
