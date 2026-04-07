"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteTeacher } from "./actions";

export function DeleteTeacherButton({ teacherId, teacherName }: { teacherId: string, teacherName: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm(`Se desactivara al docente ${teacherName}. Sus evaluaciones historicas se conservaran. Deseas continuar?`)) {
            startTransition(async () => {
                const result = await deleteTeacher(teacherId);
                if (!result.success) {
                    alert(result.error || "No se pudo desactivar el docente.");
                }
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            title={`Desactivar a ${teacherName}`}
            className={`text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all ${isPending ? "opacity-50 cursor-not-allowed" : "opacity-0 group-hover:opacity-100"}`}
        >
            {isPending ? "..." : <Trash2 size={16} />}
            <span className="sr-only">Desactivar {teacherName}</span>
        </button>
    );
}
