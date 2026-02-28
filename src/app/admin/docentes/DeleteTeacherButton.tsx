"use client";

import { useTransition } from "react";
import { deleteTeacher } from "./actions";

export function DeleteTeacherButton({ teacherId, teacherName }: { teacherId: string, teacherName: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm(`¿Estás seguro de que deseas eliminar al docente ${teacherName}? Esta acción no se puede deshacer.`)) {
            startTransition(async () => {
                await deleteTeacher(teacherId);
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-opacity ${isPending ? 'opacity-50 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100'}`}
        >
            {isPending ? "Eliminando..." : "Eliminar"}
            <span className="sr-only">, {teacherName}</span>
        </button>
    );
}

