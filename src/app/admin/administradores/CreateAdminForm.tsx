"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { createAdminAccount } from "./actions";

export default function CreateAdminForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await createAdminAccount(formData);
      if (!result.success) {
        setError(result.error || "No se pudo crear la cuenta administrativa");
        return;
      }

      formRef.current?.reset();
      setSuccess(`Cuenta administrativa creada para ${result.email}`);
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError("Ocurrio un error al crear la cuenta administrativa");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1.5 block text-sm font-bold text-slate-700";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <h2 className="font-bold text-slate-800">Registrar Administrador</h2>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          La autorizacion exige la contrasena actual del admin que realiza el alta.
        </p>
      </div>

      <form ref={formRef} action={handleSubmit} className="space-y-5 p-6">
        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700">{success}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="email" className={labelClass}>Correo del nuevo admin</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="coordinacion@uptx.edu.mx"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              Esta cuenta administrativa sera independiente y no afectara accesos de docentes.
            </p>
          </div>

          <div>
            <label htmlFor="currentPassword" className={labelClass}>Tu contrasena actual</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                placeholder="Confirma la autorizacion"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="password" className={labelClass}>Contrasena inicial</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Minimo 8 caracteres"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Confirmar contrasena</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              placeholder="Repite la contrasena"
              className={inputClass}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2 text-blue-700">
            <UserPlus className="h-4 w-4" />
            <p className="text-sm font-bold">Control recomendado</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-blue-700/90">
            Comparte esta cuenta solo con responsables autorizados. La creacion se registra automaticamente en logs como entidad ADMIN.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Crear administrador"}
          </button>
        </div>
      </form>
    </div>
  );
}
