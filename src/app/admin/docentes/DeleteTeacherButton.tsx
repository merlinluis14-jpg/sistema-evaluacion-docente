"use client";

import { useTransition } from "react";
import { deleteTeacher } from "./actions";
import { Trash2 } from "lucide-react";

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
            title={`Eliminar a ${teacherName}`}
            className={`text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all ${isPending ? 'opacity-50 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100'}`}
        >
            {isPending ? "..." : <Trash2 size={16} />}
            <span className="sr-only">Eliminar {teacherName}</span>
        </button>
    );
}

