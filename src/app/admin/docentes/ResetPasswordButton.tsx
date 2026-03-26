"use client";

import { useState } from "react";
import { KeyRound, Check, AlertTriangle } from "lucide-react";
import { resetTeacherPassword } from "./actions";
import { useRouter } from "next/navigation";

export function ResetPasswordButton({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const router = useRouter();

    const handleReset = async () => {
        if (!confirm(`¿Estás seguro de que deseas reiniciar la contraseña de ${teacherName}? Volverá a ser su Número de Empleado.`)) {
            return;
        }

        setIsPending(true);
        setStatus("idle");

        try {
            const res = await resetTeacherPassword(teacherId);
            if (res.success) {
                setStatus("success");
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                alert(res.error || "Error al reiniciar la contraseña");
            }
        } catch (error) {
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
            title="Reiniciar contraseña (volverá a ser su No. de Empleado)"
            className={`p-2 rounded-xl transition-all ${
                status === "success" 
                ? "bg-emerald-50 text-emerald-600 cursor-default" 
                : status === "error"
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
            }`}
        >
            <span className="sr-only">Reiniciar Contraseña</span>
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
