"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Mientras se verifica la sesión
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500 font-medium">Cargando tablero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 sm:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Dashboard de <span className="text-blue-600">Evaluación</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              Bienvenido de nuevo, <span className="font-semibold text-gray-900 dark:text-white">{session?.user?.name || "Administrador"}</span>
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="group flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-900/30 transition-all duration-300 font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-transform group-hover:translate-x-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Cerrar Sesión
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          {/* Card: Gestión de Docentes */}
          <Link
            href="/dashboard/docentes"
            className="group relative bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 md:col-span-1"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.174c.849-.248 1.744-.385 2.673-.418m10.146 0a12.088 12.088 0 012.673.418m-12.819 0a12.056 12.056 0 00-1.897 4.945c-.07.614-.07 1.232 0 1.847a12.054 12.054 0 001.897 4.945m12.819-11.737c.849.248 1.744.385 2.673.418m-12.819 0A12.088 12.088 0 014.26 10.174m12.819 0a12.056 12.056 0 011.897 4.945c.07.614.07 1.232 0 1.847a12.054 12.054 0 01-1.897 4.945m-14.716 0a12.056 12.056 0 004.945 1.897c.614.07 1.232.07 1.847 0a12.056 12.056 0 004.945-1.897m-11.737 0a12.088 12.088 0 01-1.285-3.202m14.307 3.202a12.088 12.088 0 001.285-3.202m-15.592 0a12.056 12.056 0 010-1.847m15.592 1.847a12.056 12.056 0 000-1.847" />
              </svg>
            </div>

            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Docentes</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Administra el padrón de catedráticos, sus datos personales y departamentos.
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold gap-2 group/btn">
              Ir a gestión
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover/btn:translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>

          {/* Card: Estado del Sistema */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Estado del Sistema</h2>
                <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Operativo
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V7.5a3 3 0 013-3h13.5a3 3 0 013 3v3.75a3 3 0 01-3 3m-13.5 0h13.5m-13.5 0a3 3 0 00-3 3v3.75a3 3 0 003 3h13.5a3 3 0 003-3v-3.75a3 3 0 00-3-3m-13.5 0h13.5" />
                </svg>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Conexión con Supabase</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-lg">ACTIVA</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Permisos de Usuario</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-lg italic">
                  {session?.user?.role || "ADMINISTRADOR"}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl flex gap-4 items-start">
              <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-xl text-amber-700 dark:text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-amber-800 dark:text-amber-300 font-bold text-sm">Próximos pasos</h3>
                <p className="text-amber-700 dark:text-amber-400 text-xs mt-1 leading-relaxed">
                  Continúa con el registro de docentes para poder habilitar las asignaturas y grupos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}