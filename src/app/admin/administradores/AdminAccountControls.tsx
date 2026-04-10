"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  KeyRound,
  Settings2,
  ShieldCheck,
  ShieldOff,
  X,
} from "lucide-react";

import {
  activateAdminAccount,
  deactivateAdminAccount,
  resetAdminPassword,
  updateAdminCareerScope,
} from "./actions";

type Mode = "none" | "reset" | "deactivate" | "activate" | "scope";

type CareerOption = {
  id: string;
  code: string;
  name: string;
  occupiedByAdminId: string | null;
  occupiedByLabel: string | null;
};

export default function AdminAccountControls({
  adminId,
  adminLabel,
  isCurrent,
  isActive,
  isLastActive,
  isGlobalScope,
  assignedCareerIds,
  availableCareers,
}: {
  adminId: string;
  adminLabel: string;
  isCurrent: boolean;
  isActive: boolean;
  isLastActive: boolean;
  isGlobalScope: boolean;
  assignedCareerIds: string[];
  availableCareers: CareerOption[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("none");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [scopeMode, setScopeMode] = useState<"global" | "assigned">(
    isGlobalScope ? "global" : "assigned",
  );
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>(assignedCareerIds);

  const canReset = isActive;
  const canDeactivate = isActive && !isCurrent && !isLastActive;
  const canActivate = !isActive;

  function closeModal() {
    if (isPending) return;
    setMode("none");
    setError("");
    setScopeMode(isGlobalScope ? "global" : "assigned");
    setSelectedCareerIds(assignedCareerIds);
  }

  function toggleCareer(careerId: string) {
    setSelectedCareerIds((current) =>
      current.includes(careerId)
        ? current.filter((item) => item !== careerId)
        : [...current, careerId],
    );
  }

  function handleResetSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await resetAdminPassword({
        targetUserId: adminId,
        currentPassword: String(formData.get("currentPassword") ?? ""),
        newPassword: String(formData.get("newPassword") ?? ""),
        confirmPassword: String(formData.get("confirmPassword") ?? ""),
      });

      if (!result.success) {
        setError(result.error || "No se pudo restablecer la contraseña");
        return;
      }

      closeModal();
      router.refresh();
    });
  }

  function handleDeactivateSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await deactivateAdminAccount({
        targetUserId: adminId,
        currentPassword: String(formData.get("currentPassword") ?? ""),
      });

      if (!result.success) {
        setError(result.error || "No se pudo desactivar la cuenta administrativa");
        return;
      }

      closeModal();
      router.refresh();
    });
  }

  function handleActivateSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await activateAdminAccount({
        targetUserId: adminId,
        currentPassword: String(formData.get("currentPassword") ?? ""),
      });

      if (!result.success) {
        setError(result.error || "No se pudo activar la cuenta administrativa");
        return;
      }

      closeModal();
      router.refresh();
    });
  }

  function handleScopeSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await updateAdminCareerScope({
        targetUserId: adminId,
        currentPassword: String(formData.get("currentPassword") ?? ""),
        scopeMode,
        careerIds: selectedCareerIds,
      });

      if (!result.success) {
        setError(result.error || "No se pudo actualizar el alcance administrativo");
        return;
      }

      closeModal();
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setScopeMode(isGlobalScope ? "global" : "assigned");
            setSelectedCareerIds(assignedCareerIds);
            setMode("scope");
          }}
          className="rounded-xl border border-indigo-200 px-3 py-2 text-center text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-50"
        >
          Alcance
        </button>
        <button
          type="button"
          onClick={() => setMode("reset")}
          disabled={!canReset}
          className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-bold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Restablecer
        </button>
        {canActivate ? (
          <button
            type="button"
            onClick={() => setMode("activate")}
            className="rounded-xl border border-emerald-200 px-3 py-2 text-center text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-50"
          >
            Activar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode("deactivate")}
            disabled={!canDeactivate}
            className="rounded-xl border border-red-200 px-3 py-2 text-center text-xs font-bold text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Desactivar
          </button>
        )}
      </div>

      {!canDeactivate && isActive ? (
        <p className="mt-2 text-[11px] font-medium text-slate-400">
          {isCurrent
            ? "Tu cuenta actual no puede desactivarse aquí"
            : isLastActive
              ? "No se puede desactivar la última cuenta activa"
              : ""}
        </p>
      ) : null}

      {canActivate ? (
        <p className="mt-2 text-[11px] font-medium text-slate-400">
          Reactiva la cuenta con tu contraseña actual para devolverle acceso.
        </p>
      ) : null}

      {mode !== "none" ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                  {mode === "scope"
                    ? "Configurar alcance del admin"
                    : mode === "reset"
                      ? "Restablecer contraseña admin"
                      : mode === "activate"
                        ? "Activar admin"
                        : "Desactivar admin"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{adminLabel}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {mode === "scope" ? (
              <form action={handleScopeSubmit} className="space-y-4 px-4 py-5 sm:px-6">
                <p className="text-sm text-slate-600">
                  Define si esta cuenta verá todo el sistema o si solo operará sobre una o varias carreras asignadas.
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  <label
                    className={`rounded-2xl border px-4 py-3 transition ${
                      scopeMode === "assigned" ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
                    }`}
                  >
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
                      Solo tendrá acceso a reportes y captura dentro de sus carreras asignadas.
                    </p>
                  </label>

                  <label
                    className={`rounded-2xl border px-4 py-3 transition ${
                      scopeMode === "global" ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"
                    }`}
                  >
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
                      Mantendrá acceso total a todas las carreras y a la gestión administrativa completa.
                    </p>
                  </label>
                </div>

                <div className={`rounded-2xl border p-4 ${scopeMode === "assigned" ? "border-blue-100 bg-slate-50" : "border-slate-200 bg-slate-100/80"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-700">Carreras asignadas</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Selecciona una o varias carreras para este jefe o coordinador.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
                      {selectedCareerIds.length} seleccionadas
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {availableCareers.map((career) => {
                      const checked = selectedCareerIds.includes(career.id);
                      const isOccupiedByAnotherAdmin = Boolean(
                        career.occupiedByAdminId && career.occupiedByAdminId !== adminId,
                      );
                      const isDisabled = scopeMode !== "assigned" || isOccupiedByAnotherAdmin;

                      return (
                        <label
                          key={career.id}
                          className={`rounded-xl border px-3 py-3 transition ${
                            checked
                              ? "border-blue-200 bg-blue-50"
                              : isOccupiedByAnotherAdmin
                                ? "border-amber-200 bg-amber-50"
                                : "border-slate-200 bg-white"
                          } ${isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isDisabled}
                            onChange={() => toggleCareer(career.id)}
                            className="sr-only"
                          />
                          <p className="text-sm font-bold text-slate-800">{career.code}</p>
                          <p className="mt-1 text-xs text-slate-500">{career.name}</p>
                          {isOccupiedByAnotherAdmin && career.occupiedByLabel ? (
                            <p className="mt-2 text-[11px] font-medium text-amber-700">
                              Asignada a: {career.occupiedByLabel}
                            </p>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Tu contraseña actual</label>
                  <input
                    name="currentPassword"
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {error ? (
                  <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Settings2 className="h-4 w-4" />
                    {isPending ? "Guardando..." : "Guardar alcance"}
                  </button>
                </div>
              </form>
            ) : mode === "reset" ? (
              <form action={handleResetSubmit} className="space-y-4 px-4 py-5 sm:px-6">
                <p className="text-sm text-slate-600">
                  Define una nueva contraseña para esta cuenta administrativa. Debes autorizar la acción con tu contraseña actual.
                </p>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Tu contraseña actual</label>
                  <input
                    name="currentPassword"
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Nueva contraseña</label>
                  <input
                    name="newPassword"
                    type="password"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Confirmar nueva contraseña</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {error ? (
                  <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound className="h-4 w-4" />
                    {isPending ? "Guardando..." : "Restablecer"}
                  </button>
                </div>
              </form>
            ) : mode === "deactivate" ? (
              <form action={handleDeactivateSubmit} className="space-y-4 px-4 py-5 sm:px-6">
                <p className="text-sm text-slate-600">
                  Esta cuenta perderá acceso al panel administrativo. Debes confirmar la acción con tu contraseña actual.
                </p>

                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Importante</p>
                  <p className="mt-1 text-sm text-amber-700">
                    No se desactiva la última cuenta admin activa y tampoco tu cuenta actual desde esta pantalla.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Tu contraseña actual</label>
                  <input
                    name="currentPassword"
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {error ? (
                  <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShieldOff className="h-4 w-4" />
                    {isPending ? "Desactivando..." : "Desactivar cuenta"}
                  </button>
                </div>
              </form>
            ) : (
              <form action={handleActivateSubmit} className="space-y-4 px-4 py-5 sm:px-6">
                <p className="text-sm text-slate-600">
                  Esta cuenta volverá a tener acceso al panel administrativo. Autoriza la reactivación con tu contraseña actual.
                </p>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Validación requerida</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    La reactivación solo puede realizarla un administrador principal activo que confirme su propia contraseña.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Tu contraseña actual</label>
                  <input
                    name="currentPassword"
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {error ? (
                  <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {isPending ? "Activando..." : "Activar cuenta"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
