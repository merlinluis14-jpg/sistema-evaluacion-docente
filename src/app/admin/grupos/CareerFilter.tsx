// src/app/admin/grupos/CareerFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Career } from "@prisma/client";

export function CareerFilter({ careers }: { careers: Career[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCareerId = searchParams.get("careerId") || "";

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        if (id) params.set("careerId", id);
        else params.delete("careerId");

        router.push(`/admin/grupos?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Filtrar por carrera:</label>
            <select
                value={currentCareerId}
                onChange={handleChange}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
            >
                <option value="">Todas las carreras</option>
                {careers.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
