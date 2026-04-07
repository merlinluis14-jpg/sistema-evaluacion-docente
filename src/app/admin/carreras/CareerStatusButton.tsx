"use client";

import { useTransition } from "react";
import { CheckCircle2, Pencil, Power } from "lucide-react";
import Link from "next/link";

import { activateCareer, deactivateCareer } from "./actions";

type Props = {
  careerId: string;
  careerCode: string;
  careerName: string;
  isActive: boolean;
};

export function CareerStatusButton({ careerId, careerCode, careerName, isActive }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const message = isActive
      ? `Se desactivara la carrera ${careerCode} - ${careerName}. Esto solo se permite si no tiene catalogos activos asociados. Deseas continuar?`
      : `Se reactivara la carrera ${careerCode} - ${careerName}. Deseas continuar?`;

    if (!confirm(message)) {
      return;
    }

    startTransition(async () => {
      const result = isActive
        ? await deactivateCareer(careerId)
        : await activateCareer(careerId);

      if (!result.success) {
        alert(result.error || "No se pudo actualizar la carrera.");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/carreras/${careerId}/editar`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Link>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
          isActive
            ? "border border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
            : "border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        {isActive ? <Power className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        {isPending ? "Procesando..." : isActive ? "Desactivar" : "Reactivar"}
      </button>
    </div>
  );
}
