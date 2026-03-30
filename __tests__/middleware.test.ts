import { proxy } from "@/proxy";
import { getToken } from "next-auth/jwt";

jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

const mockRedirect = jest.fn();
const mockNext = jest.fn();

jest.mock("next/server", () => {
  return {
    NextResponse: {
      redirect: (...args: unknown[]) => {
        mockRedirect(...args);
        return "redirected";
      },
      next: () => {
        mockNext();
        return "next";
      },
      json: jest.fn((body: unknown, init?: { status?: number }) => ({
        body,
        status: init?.status ?? 200,
      })),
    },
  };
});

function buildRequest(url: string, headers?: Record<string, string>) {
  return {
    url,
    nextUrl: new URL(url),
    headers: new Headers(headers),
  } as never;
}

describe("proxy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirige a la raiz cuando un usuario no autenticado intenta entrar a un area protegida", async () => {
    (getToken as jest.Mock).mockResolvedValue(null);

    await proxy(buildRequest("http://localhost:3000/admin"));

    const targetUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(targetUrl.pathname).toBe("/");
  });

  it("bloquea a un alumno cuando intenta entrar a /admin", async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: "ALUMNO" });

    await proxy(buildRequest("http://localhost:3000/admin/reportes"));

    const targetUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(targetUrl.pathname).toBe("/");
  });

  it("permite que un admin acceda a /admin", async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: "ADMIN" });

    await proxy(buildRequest("http://localhost:3000/admin/reportes"));

    expect(mockNext).toHaveBeenCalled();
  });

  it("redirige /dashboard al area correspondiente segun el rol autenticado", async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: "DOCENTE" });

    await proxy(buildRequest("http://localhost:3000/dashboard"));

    const targetUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(targetUrl.pathname).toBe("/docente");
  });
});
