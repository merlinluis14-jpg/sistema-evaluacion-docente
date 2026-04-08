import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseAndImportDocentes } from "@/lib/csv/parseDocentes";
import { logAdminAction } from "@/lib/adminLog";
import { createImportStreamResponse } from "@/lib/import/server";
import { getErrorMessage } from "@/lib/prismaErrors";
import { getSessionRole } from "@/lib/sessionUser";

type ImportDocentesBody = {
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
        const { csv, stream, syncCatalog } = await req.json() as ImportDocentesBody;

        if (!csv || typeof csv !== "string") {
            return NextResponse.json({ message: "CSV requerido" }, { status: 400 });
        }

        if (stream) {
            return createImportStreamResponse({
                run: (emitProgress) =>
                    parseAndImportDocentes(csv, {
                        onProgress: emitProgress,
                        syncCatalog,
                    }),
                afterComplete: async (result) => {
                    await logAdminAction({
                        action: "IMPORT",
                        entity: "DOCENTE",
                        detail: syncCatalog
                            ? `Importación CSV con sincronización: ${result.success} docentes importados de ${result.total} filas; ${result.deactivatedCount ?? 0} docentes desactivados`
                            : `Importación CSV: ${result.success} docentes importados de ${result.total} filas`,
                    });
                },
            });
        }

        const result = await parseAndImportDocentes(csv, { syncCatalog });

        try {
            await logAdminAction({
                action: "IMPORT",
                entity: "DOCENTE",
                detail: syncCatalog
                    ? `Importación CSV con sincronización: ${result.success} docentes importados de ${result.total} filas; ${result.deactivatedCount ?? 0} docentes desactivados`
                    : `Importación CSV: ${result.success} docentes importados de ${result.total} filas`,
            });
        } catch (loggingError) {
            console.error("No fue posible registrar la importacion de docentes:", loggingError);
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error importando docentes:", error);
        return NextResponse.json({ message: getErrorMessage(error) }, { status: 500 });
    }
}
