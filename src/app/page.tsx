"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
    <main className="min-h-screen bg-[#fafafa] text-slate-900 font-sans flex flex-col p-4 sm:p-8">
      
      {/* Contenedor flexible para centrar la tarjeta */}
      <div className="flex-1 flex items-center justify-center py-6">
        {/* Contenedor principal estilo tarjeta clara */}
      <div className="w-full max-w-7xl h-[85vh] min-h-[600px] border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] bg-white flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Top bar (oculta en móvil si la movemos al formulario, o la mantenemos relativa) */}
        {/* Mejor movermos el logo dentro de la columna del formulario para el móvil */}

        {/* --- Columna Izquierda: Imagen (Ocupa 55%) --- */}
        <div className="hidden lg:block w-[55%] relative h-full p-4">
          <div className="w-full h-full relative rounded-[2rem] overflow-hidden shadow-inner">
            {/* Imagen autogenerada para el tema claro */}
            <Image 
              src="/login.jpeg" 
              alt="Administración UPT Eval" 
              fill
              className="object-cover animate-in fade-in duration-1000"
              priority
            />
            {/* Gradiente sutil para suavizar bordes */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 via-transparent"></div>
          </div>
        </div>

        {/* --- Columna Derecha: Formulario (Ocupa 45%) --- */}
        <div className="flex-1 flex flex-col relative z-10 px-5 sm:px-8 lg:px-16 py-8 lg:py-10">
          
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full max-w-[360px] animate-in slide-in-from-bottom-8 duration-700 font-sans">
              
              {/* Logo integrado en el flujo para móvil, centrado o alineado */}
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-8 lg:absolute lg:top-8 lg:left-10">
                <div className="px-2.5 h-9 bg-black text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md">
                  UPTEX
                </div>
                <span className="font-bold tracking-tight text-slate-800">Evaluación Docente</span>
              </div>

              <div className="text-center mb-10 mt-4 lg:mt-0">
                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">¡Bienvenido!</h1>
                <p className="text-sm font-medium text-slate-500 tracking-wide">
                  Sistema de Evaluación Académica UPTX
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? "login-error" : undefined}>
                
                <div>
                  <label htmlFor="username" className="sr-only">
                    Identificador o correo
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      className="w-full pl-5 pr-11 py-3.5 sm:py-4 bg-[#f4f4f5] border border-transparent rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100 outline-none transition-all font-medium text-sm"
                      placeholder="Identificador o correo"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">
                    ContraseÃ±a
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      className="w-full pl-5 pr-11 py-3.5 sm:py-4 bg-[#f4f4f5] border border-transparent rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100 outline-none transition-all font-medium text-sm"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {error && (
                  <div
                    id="login-error"
                    role="alert"
                    className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl text-center font-medium mt-1"
                  >
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className="w-full py-4 rounded-xl text-sm font-bold text-white bg-[#0f172a] hover:bg-black focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-200 active:scale-[0.98]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2" aria-live="polite">
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verificando...
                      </span>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </button>
                </div>

              </form>

              <div className="mt-8 pt-6 border-t border-slate-100/60">
                <p className="text-center text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                  Solo acceso autorizado por el administrador
                </p>
              </div>

            </div>
          </div>
          
        </div>
      </div>
      </div>
      
      {/* Footer minimalista, ahora en el flujo normal para evitar solapamientos en móvil */}
      <footer className="w-full text-center mt-auto pt-8 pb-2">
        <div className="inline-flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest px-6 py-3 rounded-2xl sm:rounded-full bg-white/60 shadow-sm border border-slate-200/50">
          <span>© 2026 UPTX</span>
          <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></div>
          <Link href="/privacidad" className="hover:text-slate-800 transition-colors">
            Avisos de Privacidad
          </Link>
          <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></div>
          <span className="hover:text-slate-800 cursor-pointer transition-colors">
            Soporte Técnico
          </span>
        </div>
      </footer>

    </main>
  );
}
