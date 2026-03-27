"use client";

import { signOut } from "next-auth/react";
import Swal from "sweetalert2";

interface SignOutButtonProps {
    className?: string;
    children: React.ReactNode;
}

export function SignOutButton({ className, children }: SignOutButtonProps) {
    const handleSignOut = (e: React.MouseEvent) => {
        e.preventDefault(); // Por si está envuelto en algo o cambia el foco
        
        Swal.fire({
            title: "¿Cerrar sesión?",
            text: "¿Estás seguro que deseas salir del sistema?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#0f172a", // slate-900
            cancelButtonColor: "#ef4444", // red-500
            confirmButtonText: "Sí, salir",
            cancelButtonText: "Cancelar",
            background: "#ffffff",
            color: "#0f172a",
            customClass: {
                popup: "rounded-3xl shadow-2xl border border-slate-100",
                confirmButton: "rounded-xl px-4 py-2 text-sm font-bold",
                cancelButton: "rounded-xl px-4 py-2 text-sm font-bold",
                title: "text-xl font-black",
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Muestra un loader rápido mientras cierra sesión
                Swal.fire({
                    title: "Cerrando sesión...",
                    text: "Por favor espera",
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                // Cierra la sesión y redirige al inicio directamente
                signOut({ callbackUrl: "/" });
            }
        });
    };

    return (
        <button onClick={handleSignOut} className={`text-left w-full ${className || ""}`}>
            {children}
        </button>
    );
}
