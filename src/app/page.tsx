"use client";

import Image from "next/image";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error || !result?.ok) {
      setError("Credenciales inválidas. Verifica tu usuario y contraseña.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: string })?.role;

    if (role === "ADMIN") router.push("/admin");
    else if (role === "DOCENTE") router.push("/docente");
    else if (role === "ALUMNO") router.push("/alumno");
    else router.push("/admin");
  };

  return (
    <main className="flex min-h-dvh flex-col bg-[#fafafa] p-3 font-sans text-slate-900 sm:p-6 lg:p-8">
      <div className="flex flex-1 items-center justify-center py-3 sm:py-5">
        <div className="relative flex w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] lg:h-[85vh] lg:min-h-[600px] lg:flex-row lg:rounded-[2.5rem]">
          <div className="relative hidden h-full w-[55%] p-4 lg:block">
            <div className="relative h-full w-full overflow-hidden rounded-[2rem] shadow-inner">
              <Image
                src="/login.jpeg"
                alt="Administración UPTex"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="animate-in object-cover fade-in duration-1000"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/10" />
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col px-5 py-6 sm:px-8 sm:py-7 lg:px-16 lg:py-10">
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="w-full max-w-[360px] animate-in slide-in-from-bottom-8 font-sans duration-700">
                <div className="mb-6 flex items-center justify-center gap-2 lg:absolute lg:left-10 lg:top-8 lg:mb-0 lg:justify-start">
                  <div className="flex h-9 items-center justify-center rounded-xl bg-black px-2.5 text-sm font-black text-white shadow-md">
                    UPTex
                  </div>
                  <span className="font-bold tracking-tight text-slate-800">Evaluación Docente</span>
                </div>

                <div className="mb-8 mt-2 text-center lg:mt-0">
                  <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900">Bienvenido</h1>
                  <p className="text-sm font-medium tracking-wide text-slate-500">
                    Sistema de Evaluación Académica UPTex
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  aria-describedby={error ? "login-error" : undefined}
                >
                  <div>
                    <label htmlFor="username" className="sr-only">
                      Identificador o correo
                    </label>
                    <div className="relative">
                      <input
                        id="username"
                        type="text"
                        className="w-full rounded-xl border border-transparent bg-[#f4f4f5] py-3 pl-5 pr-11 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100 sm:py-3.5"
                        placeholder="Identificador o correo"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                      />
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="sr-only">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type="password"
                        className="w-full rounded-xl border border-transparent bg-[#f4f4f5] py-3 pl-5 pr-11 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100 sm:py-3.5"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div
                      id="login-error"
                      role="alert"
                      className="mt-1 rounded-xl border border-red-100 bg-red-50 p-3 text-center text-xs font-medium text-red-600"
                    >
                      {error}
                    </div>
                  )}

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      aria-busy={loading}
                      className="w-full rounded-xl bg-[#0f172a] py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-black focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2" aria-live="polite">
                          <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Verificando...
                        </span>
                      ) : (
                        "Iniciar Sesión"
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6 border-t border-slate-100/60 pt-5">
                  <p className="text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Solo acceso autorizado por el administrador
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-auto w-full pb-1 pt-4 text-center sm:pt-6">
        <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-slate-200/50 bg-white/60 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 shadow-sm sm:rounded-full">
          <span>(c) 2026 UPTex</span>
          <div className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
          <Link href="/privacidad" className="transition-colors hover:text-slate-800">
            Avisos de Privacidad
          </Link>
          <div className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
          <span className="cursor-pointer transition-colors hover:text-slate-800">
            Soporte Técnico
          </span>
        </div>
      </footer>
    </main>
  );
}
