"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Clipboard,
  KeyRound,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";

import { resetTeacherPassword } from "./actions";

type ResetPasswordButtonProps = {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
};

export function ResetPasswordButton({
  teacherId,
  teacherName,
  teacherEmail,
}: ResetPasswordButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const resetCopyStatus = () => {
    window.setTimeout(() => setCopyStatus("idle"), 2200);
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    } finally {
      resetCopyStatus();
    }
  };

  const handleCopyMessage = async () => {
    const messageLines = [
      "Acceso al Sistema de Evaluación Docente UPTX",
      `Docente: ${teacherName}`,
      `Usuario: ${teacherEmail}`,
      `Contraseña temporal: ${temporaryPassword}`,
      "Comparte esta información por un canal seguro.",
    ];

    try {
      await navigator.clipboard.writeText(messageLines.join("\n"));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    } finally {
      resetCopyStatus();
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        `Se generará una nueva contraseña temporal para ${teacherName}. ¿Deseas continuar?`,
      )
    ) {
      return;
    }

    setIsPending(true);
    setStatus("idle");
    setCopyStatus("idle");

    try {
      const res = await resetTeacherPassword(teacherId);
      if (res.success && res.temporaryPassword) {
        setStatus("success");
        setTemporaryPassword(res.temporaryPassword);
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        alert(res.error || "Error al generar la contraseña temporal");
      }
    } catch {
      setStatus("error");
      alert("Error de conexión");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        onClick={handleReset}
        disabled={isPending}
        title="Generar nueva contraseña temporal"
        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
          status === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status === "error"
              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
        } ${isPending ? "cursor-wait opacity-70" : ""}`}
      >
        <span className="sr-only">Generar nueva contraseña temporal</span>
        {status === "success" ? (
          <Check className="h-4 w-4" />
        ) : status === "error" ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        <span>Restablecer</span>
      </button>

      {temporaryPassword && (
        <div className="fixed inset-x-3 bottom-3 z-50 w-auto max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-slate-200/70 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-full sm:max-w-sm">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-4 text-white sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100 sm:text-xs sm:tracking-[0.24em]">
                  <ShieldCheck className="h-4 w-4" />
                  Contraseña temporal generada
                </p>
                <h3 className="break-words text-base font-black leading-tight sm:text-lg">
                  {teacherName}
                </h3>
                <p className="flex items-center gap-2 break-all text-sm text-blue-50">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-all">{teacherEmail}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTemporaryPassword("");
                  setCopyStatus("idle");
                  setStatus("idle");
                }}
                className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
                title="Cerrar tarjeta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.2em]">
                Nueva contraseña
              </p>
              <p className="mt-2 break-all font-mono text-base font-bold text-slate-900 sm:text-lg">
                {temporaryPassword}
              </p>
            </div>

            <p className="text-sm leading-6 text-slate-600">
              Comparte esta información solo por un canal seguro.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleCopyPassword}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Clipboard className="h-4 w-4" />
                Copiar contraseña
              </button>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
              >
                <Mail className="h-4 w-4" />
                Copiar mensaje
              </button>
            </div>

            {copyStatus === "copied" && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                El contenido se copió al portapapeles.
              </div>
            )}

            {copyStatus === "error" && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                No se pudo copiar automáticamente. Selecciona el texto y cópialo manualmente.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
