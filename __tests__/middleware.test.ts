import { middleware } from "@/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Mock de next-auth/jwt
jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

// Setup de entorno Next.js para pruebas
const mockRedirect = jest.fn();
const mockNext = jest.fn();

jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server");
  return {
    ...actual,
    NextResponse: {
      redirect: (...args: any[]) => { mockRedirect(...args); return "redirected"; },
      next: () => { mockNext(); return "next"; },
    },
  };
});

describe("Middleware - Control de Acceso por Roles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe redirigir usuarios no autenticados al login al intentar acceder a rutas protegidas", async () => {
    (getToken as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/admin");
    
    await middleware(req);
    
    expect(mockRedirect).toHaveBeenCalled();
    const targetUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(targetUrl.pathname).toBe("/login");
  });

  it("Debe denegar el acceso a un ALUMNO intentando entrar a /admin", async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: "ALUMNO" });
    const req = new NextRequest("http://localhost:3000/admin/reportes");
    
    await middleware(req);
    
    expect(mockRedirect).toHaveBeenCalled();
    const targetUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(targetUrl.pathname).toBe("/login");
  });

  it("Debe denegar el acceso a un DOCENTE intentando entrar a /admin", async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: "DOCENTE" });
    const req = new NextRequest("http://localhost:3000/admin");
    
    await middleware(req);
    
    expect(mockRedirect).toHaveBeenCalled();
  });

  it("Debe permitir que un ADMIN acceda libremente a /admin", async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: "ADMIN" });
    const req = new NextRequest("http://localhost:3000/admin/reportes");
    
    await middleware(req);
    
    expect(mockNext).toHaveBeenCalled();
  });

  it("Debe redirigir la ruta raíz /dashboard hacia el área correspondiente al rol", async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: "DOCENTE" });
    const req = new NextRequest("http://localhost:3000/dashboard");
    
    await middleware(req);
    
    expect(mockRedirect).toHaveBeenCalled();
    const targetUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(targetUrl.pathname).toBe("/docente");
  });
});
