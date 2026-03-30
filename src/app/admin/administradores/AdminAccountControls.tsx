"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, KeyRound, ShieldOff, X } from "lucide-react";
import { deactivateAdminAccount, resetAdminPassword } from "./actions";

type Mode = "none" | "reset" | "deactivate";

export default function AdminAccountControls({
  adminId,
  adminLabel,
  isCurrent,
  isActive,
  isLastActive,
}: {
  adminId: string;
  adminLabel: string;
  isCurrent: boolean;
  isActive: boolean;
  isLastActive: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("none");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const canReset = isActive;
  const canDeactivate = isActive && !isCurrent && !isLastActive;

  function closeModal() {
    if (isPending) return;
    setMode("none");
    setError("");
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
        setError(result.error || "No se pudo restablecer la contrasena");
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setMode("reset")}
          disabled={!canReset}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Restablecer
        </button>
        <button
          type="button"
          onClick={() => setMode("deactivate")}
          disabled={!canDeactivate}
          className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Desactivar
        </button>
      </div>

      {!canDeactivate && isActive ? (
        <p className="mt-2 text-right text-[11px] font-medium text-slate-400">
          {isCurrent
            ? "Tu cuenta actual no puede desactivarse aqui"
            : isLastActive
              ? "No se puede desactivar la ultima cuenta activa"
              : ""}
        </p>
      ) : null}

      {mode !== "none" ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-800">
                  {mode === "reset" ? "Restablecer contrasena admin" : "Desactivar admin"}
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

            {mode === "reset" ? (
              <form action={handleResetSubmit} className="space-y-4 px-6 py-5">
                <p className="text-sm text-slate-600">
                  Define una nueva contrasena para esta cuenta administrativa. Debes autorizar la accion con tu contrasena actual.
                </p>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Tu contrasena actual</label>
                  <input
                    name="currentPassword"
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Nueva contrasena</label>
                  <input
                    name="newPassword"
                    type="password"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Confirmar nueva contrasena</label>
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

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound className="h-4 w-4" />
                    {isPending ? "Guardando..." : "Restablecer"}
                  </button>
                </div>
              </form>
            ) : (
              <form action={handleDeactivateSubmit} className="space-y-4 px-6 py-5">
                <p className="text-sm text-slate-600">
                  Esta cuenta perdera acceso al panel administrativo. Debes confirmar la accion con tu contrasena actual.
                </p>

                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Importante</p>
                  <p className="mt-1 text-sm text-amber-700">
                    No se desactiva la ultima cuenta admin activa y tampoco tu cuenta actual desde esta pantalla.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Tu contrasena actual</label>
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

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShieldOff className="h-4 w-4" />
                    {isPending ? "Desactivando..." : "Desactivar cuenta"}
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
