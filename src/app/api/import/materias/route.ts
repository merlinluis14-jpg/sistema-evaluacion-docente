import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseAndImportMaterias } from "@/lib/csv/parseMaterias";
import { logAdminAction } from "@/lib/adminLog";
import { createImportStreamResponse } from "@/lib/import/server";
import { getErrorMessage } from "@/lib/prismaErrors";
import { getSessionRole } from "@/lib/sessionUser";

type ImportMateriasBody = {
    csv?: string;
    stream?: boolean;
    syncCatalog?: boolean;
};

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || getSessionRole(session) !== "ADMIN") {
        return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    try {
        const { csv, stream, syncCatalog } = await req.json() as ImportMateriasBody;

        if (!csv || typeof csv !== "string") {
            return NextResponse.json({ message: "CSV requerido" }, { status: 400 });
        }

        if (stream) {
            return createImportStreamResponse({
                run: (emitProgress) =>
                    parseAndImportMaterias(csv, {
                        onProgress: emitProgress,
                        syncCatalog,
                    }),
                afterComplete: async (result) => {
                    await logAdminAction({
                        action: "IMPORT",
                        entity: "MATERIA",
                        detail: syncCatalog
                            ? `Importación CSV con sincronización: ${result.success} materias importadas de ${result.total} filas; ${result.deactivatedCount ?? 0} materias desactivadas`
                            : `Importación CSV: ${result.success} materias importadas de ${result.total} filas`,
                    });
                },
            });
        }

        const result = await parseAndImportMaterias(csv, { syncCatalog });

        try {
            await logAdminAction({
                action: "IMPORT",
                entity: "MATERIA",
                detail: syncCatalog
                    ? `Importación CSV con sincronización: ${result.success} materias importadas de ${result.total} filas; ${result.deactivatedCount ?? 0} materias desactivadas`
                    : `Importación CSV: ${result.success} materias importadas de ${result.total} filas`,
            });
        } catch (loggingError) {
            console.error("No fue posible registrar la importacion de materias:", loggingError);
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error importando materias:", error);
        return NextResponse.json({ message: getErrorMessage(error) }, { status: 500 });
    }
}
