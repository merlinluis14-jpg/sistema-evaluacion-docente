import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseAndImportAlumnos } from "@/lib/csv/parseAlumnos";
import { logAdminAction } from "@/lib/adminLog";
import { createImportStreamResponse } from "@/lib/import/server";
import { getErrorMessage } from "@/lib/prismaErrors";
import { getSessionRole } from "@/lib/sessionUser";

type ImportAlumnosBody = {
    csv?: string;
    periodo?: string;
    stream?: boolean;
    syncCatalog?: boolean;
};

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || getSessionRole(session) !== "ADMIN") {
        return NextResponse.json(
            { message: "No autorizado" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json() as ImportAlumnosBody;
        const { csv, periodo, stream, syncCatalog } = body;

        if (!csv || typeof csv !== "string") {
            return NextResponse.json(
                { message: "CSV invÃ¡lido o vacÃ­o" },
                { status: 400 }
            );
        }

        if (!periodo || typeof periodo !== "string") {
            return NextResponse.json(
                { message: "El período es requerido" },
                { status: 400 }
            );
        }

        if (csv.length > 5 * 1024 * 1024) {
            return NextResponse.json(
                { message: "El archivo supera el límite de 5 MB" },
                { status: 400 }
            );
        }

        if (stream) {
            return createImportStreamResponse({
                run: (emitProgress) =>
                    parseAndImportAlumnos(csv, periodo, {
                        onProgress: emitProgress,
                        syncCatalog,
                    }),
                afterComplete: async (result) => {
                    await logAdminAction({
                        action: "IMPORT",
                        entity: "ALUMNO",
                        detail: syncCatalog
                            ? `Importación CSV con sincronización: ${result.success} alumnos importados de ${result.total} filas (período: ${periodo.trim()}); ${result.removedEnrollments ?? 0} asignaciones retiradas`
                            : `Importación CSV: ${result.success} alumnos importados de ${result.total} filas (período: ${periodo.trim()})`,
                    });
                },
            });
        }

        const result = await parseAndImportAlumnos(csv, periodo, { syncCatalog });

        try {
            await logAdminAction({
                action: "IMPORT",
                entity: "ALUMNO",
                detail: syncCatalog
                    ? `Importación CSV con sincronización: ${result.success} alumnos importados de ${result.total} filas (período: ${periodo.trim()}); ${result.removedEnrollments ?? 0} asignaciones retiradas`
                    : `Importación CSV: ${result.success} alumnos importados de ${result.total} filas (período: ${periodo.trim()})`,
            });
        } catch (loggingError) {
            console.error("No fue posible registrar la importacion de alumnos:", loggingError);
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error en importacion CSV:", error);
        return NextResponse.json(
            { message: getErrorMessage(error) },
            { status: 500 }
        );
    }
}
