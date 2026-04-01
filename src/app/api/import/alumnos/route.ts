import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseAndImportAlumnos } from "@/lib/csv/parseAlumnos";
import { logAdminAction } from "@/lib/adminLog";
import { createImportStreamResponse } from "@/lib/import/server";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json(
            { message: "No autorizado" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { csv, periodo, stream } = body;

        if (!csv || typeof csv !== "string") {
            return NextResponse.json(
                { message: "CSV invÃ¡lido o vacÃ­o" },
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
                { message: "El archivo supera el lÃ­mite de 5 MB" },
                { status: 400 }
            );
        }

        if (stream) {
            return createImportStreamResponse({
                run: (emitProgress) =>
                    parseAndImportAlumnos(csv, periodo, { onProgress: emitProgress }),
                afterComplete: async (result) => {
                    await logAdminAction({
                        action: "IMPORT",
                        entity: "ALUMNO",
                        detail: `Importacion CSV: ${result.success} alumnos importados de ${result.total} filas (periodo: ${periodo.trim()})`,
                    });
                },
            });
        }

        const result = await parseAndImportAlumnos(csv, periodo);

        try {
            await logAdminAction({
                action: "IMPORT",
                entity: "ALUMNO",
                detail: `Importacion CSV: ${result.success} alumnos importados de ${result.total} filas (periodo: ${periodo.trim()})`,
            });
        } catch (loggingError) {
            console.error("No fue posible registrar la importacion de alumnos:", loggingError);
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error("Error en importacion CSV:", error);
        return NextResponse.json(
            { message: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}
