"use client";

import { useState } from "react";
import { AlertTriangle, Check, KeyRound } from "lucide-react";

import { resetStudentPassword } from "./actions";

export function ResetStudentPasswordButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleReset = async () => {
    if (
      !confirm(
        `¿Deseas restablecer la contraseña de ${studentName}? Volverá a ser su matrícula y el alumno podrá cambiarla una sola vez desde su panel.`,
      )
    ) {
      return;
    }

    setIsPending(true);
    setStatus("idle");

    try {
      const result = await resetStudentPassword(studentId);

      if (result.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        alert(result.error || "No fue posible restablecer la contraseña");
      }
    } catch {
      setStatus("error");
      alert("Error de conexión");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={isPending || status === "success"}
      title="Restablecer contraseña a matrícula"
      className={`rounded-lg p-2 transition-all ${
        status === "success"
          ? "cursor-default bg-emerald-50 text-emerald-600"
          : status === "error"
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
      }`}
    >
      <span className="sr-only">Restablecer contraseña</span>
      {status === "success" ? (
        <Check className="h-5 w-5" />
      ) : status === "error" ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <KeyRound className="h-5 w-5" />
      )}
    </button>
  );
}
