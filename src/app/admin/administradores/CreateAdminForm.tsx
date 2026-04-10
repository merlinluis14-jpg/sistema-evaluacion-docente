"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  KeyRound,
  Mail,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";

import { createAdminAccount } from "./actions";

type CreatedAdminAccount = {
  email: string;
  password: string;
  isGlobalScope: boolean;
  careerCodes: string[];
};

type CareerOption = {
  id: string;
  code: string;
  name: string;
  occupiedByAdminId: string | null;
  occupiedByLabel: string | null;
};

export default function CreateAdminForm({
  availableCareers,
}: {
  availableCareers: CareerOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdAccount, setCreatedAccount] = useState<CreatedAdminAccount | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [scopeMode, setScopeMode] = useState<"global" | "assigned">("assigned");
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([]);

  function resetCopyStatus() {
    window.setTimeout(() => setCopyStatus("idle"), 2200);
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    } finally {
      resetCopyStatus();
    }
  }

  function toggleCareer(careerId: string) {
    setSelectedCareerIds((current) =>
      current.includes(careerId)
        ? current.filter((item) => item !== careerId)
        : [...current, careerId],
    );
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    setSuccess("");
    setCopyStatus("idle");
    setCreatedAccount(null);

    const nextEmail = String(formData.get("email") ?? "").trim().toLowerCase();
    const nextPassword = String(formData.get("password") ?? "");

    try {
      const result = await createAdminAccount(formData);
      if (!result.success) {
        setError(result.error || "No se pudo crear la cuenta administrativa");
        return;
      }

      formRef.current?.reset();
      setScopeMode("assigned");
      setSelectedCareerIds([]);
      const createdEmail = result.email ?? nextEmail;
      setSuccess(`Cuenta administrativa creada para ${createdEmail}`);
      setCreatedAccount({
        email: createdEmail,
        password: nextPassword,
        isGlobalScope: Boolean(result.isGlobalScope),
        careerCodes: result.careerCodes ?? [],
      });
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError("Ocurrió un error al crear la cuenta administrativa");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1.5 block text-sm font-bold text-slate-700";
  const isAssignedScope = scopeMode === "assigned";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <h2 className="font-bold text-slate-800">Registrar Administrador</h2>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          La autorización exige la contraseña actual del admin principal que realiza el alta.
        </p>
      </div>

      <form ref={formRef} action={handleSubmit} className="space-y-3.5 p-4 sm:p-5">
        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700">{success}</p>
          </div>
        ) : null}

        {createdAccount ? (
          <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg shadow-slate-200/50">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-4 text-white sm:px-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.24em]">
                    <ShieldCheck className="h-4 w-4" />
                    Cuenta administrativa creada
                  </p>
                  <h3 className="break-words text-base font-black leading-tight sm:text-lg">
                    {createdAccount.email}
                  </h3>
                  <p className="text-sm text-blue-50">
                    Comparte estas credenciales solo con personal autorizado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedAccount(null);
                    setCopyStatus("idle");
                  }}
                  className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
                  title="Cerrar tarjeta"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3.5 px-4 py-4 sm:px-5 sm:py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.2em]">
                    Correo admin
                  </p>
                  <p className="mt-2 break-all text-sm font-bold text-slate-900">
                    {createdAccount.email}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.2em]">
                    Contraseña inicial
                  </p>
                  <p className="mt-2 break-all font-mono text-sm font-bold text-slate-900">
                    {createdAccount.password}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.2em]">
                  Alcance asignado
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {createdAccount.isGlobalScope
                    ? "Acceso global a todas las carreras"
                    : createdAccount.careerCodes.length > 0
                      ? `Carreras: ${createdAccount.careerCodes.join(", ")}`
                      : "Sin carreras asignadas"}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      [
                        `Correo: ${createdAccount.email}`,
                        `Contraseña inicial: ${createdAccount.password}`,
                        createdAccount.isGlobalScope
                          ? "Alcance: acceso global"
                          : `Carreras asignadas: ${createdAccount.careerCodes.join(", ")}`,
                      ].join("\n"),
                    )
                  }
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Clipboard className="h-4 w-4" />
                  Copiar credenciales
                </button>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      [
                        "Acceso al Panel Administrativo UPTex",
                        `Usuario: ${createdAccount.email}`,
                        `Contraseña inicial: ${createdAccount.password}`,
                        createdAccount.isGlobalScope
                          ? "Alcance: acceso global"
                          : `Carreras asignadas: ${createdAccount.careerCodes.join(", ")}`,
                        "Comparte esta información por un canal seguro.",
                      ].join("\n"),
                    )
                  }
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <Mail className="h-4 w-4" />
                  Copiar mensaje
                </button>
              </div>

              {copyStatus === "copied" ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  Los datos se copiaron al portapapeles.
                </div>
              ) : null}

              {copyStatus === "error" ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  No se pudo copiar automáticamente. Copia los datos manualmente desde la tarjeta.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="email" className={labelClass}>
              Correo del nuevo admin
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="coordinacion@uptex.edu.mx"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              Esta cuenta administrativa será independiente y no afectará accesos de docentes.
            </p>
          </div>

          <div>
            <label htmlFor="currentPassword" className={labelClass}>
              Tu contraseña actual
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                placeholder="Confirma la autorización"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="password" className={labelClass}>
              Contraseña inicial
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              placeholder="Repite la contraseña"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-sm font-bold text-slate-700">Alcance administrativo</p>
            <p className="mt-1 text-xs text-slate-500">
              Define si esta cuenta será global o si solo operará como jefatura/coordinación de carreras específicas.
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <label className={`rounded-2xl border px-4 py-2.5 transition ${scopeMode === "assigned" ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
              <input
                type="radio"
                name="scopeMode"
                value="assigned"
                checked={scopeMode === "assigned"}
                onChange={() => setScopeMode("assigned")}
                className="sr-only"
              />
              <p className="text-sm font-bold text-slate-800">Jefatura por carreras</p>
              <p className="mt-1 text-xs text-slate-500">
                Solo verá y capturará información de las carreras seleccionadas.
              </p>
            </label>

            <label className={`rounded-2xl border px-4 py-2.5 transition ${scopeMode === "global" ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"}`}>
              <input
                type="radio"
                name="scopeMode"
                value="global"
                checked={scopeMode === "global"}
                onChange={() => setScopeMode("global")}
                className="sr-only"
              />
              <p className="text-sm font-bold text-slate-800">Administrador global</p>
              <p className="mt-1 text-xs text-slate-500">
                Tendrá acceso completo a todas las carreras y a la gestión total del panel.
              </p>
            </label>
          </div>

          <div className={`rounded-2xl border p-4 ${isAssignedScope ? "border-blue-100 bg-white" : "border-slate-200 bg-slate-100/80"}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700">Carreras asignadas</p>
                <p className="mt-1 text-xs text-slate-500">
                  Selecciona una o varias carreras para este jefe o coordinador.
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Las carreras ya asignadas a otra jefatura activa aparecen bloqueadas para evitar traslapes.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {selectedCareerIds.length} seleccionadas
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {availableCareers.map((career) => {
                const checked = selectedCareerIds.includes(career.id);
                const isOccupied = Boolean(career.occupiedByAdminId);
                const isDisabled = !isAssignedScope || isOccupied;

                return (
                  <label
                    key={career.id}
                    className={`rounded-xl border px-3 py-2 transition ${
                      checked
                        ? "border-blue-200 bg-blue-50"
                        : isOccupied
                          ? "border-amber-200 bg-amber-50"
                          : "border-slate-200 bg-white"
                    } ${isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      name="careerIds"
                      value={career.id}
                      checked={checked}
                      disabled={isDisabled}
                      onChange={() => toggleCareer(career.id)}
                      className="sr-only"
                    />
                    <p className="text-sm font-bold text-slate-800">{career.code}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{career.name}</p>
                    {career.occupiedByLabel ? (
                      <p className="mt-2 text-[11px] font-medium text-amber-700">
                        Asignada a: {career.occupiedByLabel}
                      </p>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2 text-blue-700">
            <UserPlus className="h-4 w-4" />
            <p className="text-sm font-bold">Control recomendado</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-blue-700/90">
            Comparte esta cuenta solo con responsables autorizados. La creación se registra automáticamente
            en logs como entidad ADMIN y su alcance se puede actualizar después.
          </p>
        </div>

        <div className="flex justify-end pt-0.5">
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
