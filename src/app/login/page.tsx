// src/app/login/page.tsx
"use client"; // Directiva obligatoria en Next.js para componentes con interactividad (formularios)

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Limpiamos errores previos
    
    // Llamamos a la función signIn que conecta con nuestro route.ts
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false, // Evitamos que NextAuth recargue la página automáticamente
    });

    if (result?.error) {
      setError("Credenciales inválidas. Verifica tu matrícula y contraseña.");
    } else {
      // Redirección al panel principal tras login exitoso (ajusta la ruta según tu proyecto)
      router.push("/dashboard"); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {/* Contenedor principal con diseño responsive (RNF2) */}
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-900">UPTX</h1>
          <h2 className="text-lg text-gray-600 mt-2">Sistema de Evaluación Docente</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matrícula
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Ej. 122030..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Mensaje de error condicional */}
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}