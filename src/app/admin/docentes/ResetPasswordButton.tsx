"use client";

import { useState } from "react";
import { AlertTriangle, Check, KeyRound } from "lucide-react";

import { resetTeacherPassword } from "./actions";

export function ResetPasswordButton({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleReset = async () => {
        if (!confirm(`Se generara una nueva contrasena temporal para ${teacherName}. Deseas continuar?`)) {
            return;
        }

        setIsPending(true);
        setStatus("idle");

        try {
            const res = await resetTeacherPassword(teacherId);
            if (res.success) {
                setStatus("success");
                alert(
                    `Nueva contrasena temporal para ${teacherName}: ${res.temporaryPassword}\n\nCompartela por un canal seguro y almacenala solo si es necesario.`,
                );
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                alert(res.error || "Error al generar la contrasena temporal");
            }
        } catch {
            setStatus("error");
            alert("Error de conexion");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleReset}
            disabled={isPending || status === "success"}
            title="Generar nueva contrasena temporal"
            className={`p-2 rounded-xl transition-all ${
                status === "success"
                    ? "bg-emerald-50 text-emerald-600 cursor-default"
                    : status === "error"
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
            }`}
        >
            <span className="sr-only">Generar nueva contrasena temporal</span>
            {status === "success" ? (
                <Check className="w-5 h-5" />
            ) : status === "error" ? (
                <AlertTriangle className="w-5 h-5" />
            ) : (
                <KeyRound className="w-5 h-5" />
            )}
        </button>
    );
}
