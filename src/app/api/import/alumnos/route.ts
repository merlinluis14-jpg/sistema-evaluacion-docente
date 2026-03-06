import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseAndImportAlumnos } from "@/lib/csv/parseAlumnos";

export async function POST(req: NextRequest) {
    // Solo administradores
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json(
            { message: "No autorizado" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { csv, periodo } = body;

        // Validaciones básicas
        if (!csv || typeof csv !== "string") {
            return NextResponse.json(
                { message: "CSV inválido o vacío" },
                { status: 400 }
            );
        }
        if (!periodo || typeof periodo !== "string") {
            return NextResponse.json(
                { message: "El periodo es requerido" },
                { status: 400 }
            );
        }
        if (csv.length > 5 * 1024 * 1024) {
            return NextResponse.json(
                { message: "El archivo supera el límite de 5 MB" },
                { status: 400 }
            );
        }

        // Procesar importación
        const result = await parseAndImportAlumnos(csv, periodo);

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("Error en importación CSV:", error);
        return NextResponse.json(
            { message: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}
