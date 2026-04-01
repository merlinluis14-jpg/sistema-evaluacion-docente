import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseAndImportDocentes } from "@/lib/csv/parseDocentes";
import { logAdminAction } from "@/lib/adminLog";
import { createImportStreamResponse } from "@/lib/import/server";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    try {
        const { csv, stream } = await req.json();

        if (!csv || typeof csv !== "string") {
            return NextResponse.json({ message: "CSV requerido" }, { status: 400 });
        }

        if (stream) {
            return createImportStreamResponse({
                run: (emitProgress) =>
                    parseAndImportDocentes(csv, { onProgress: emitProgress }),
                afterComplete: async (result) => {
                    await logAdminAction({
                        action: "IMPORT",
                        entity: "DOCENTE",
                        detail: `Importacion CSV: ${result.success} docentes importados de ${result.total} filas`,
                    });
                },
            });
        }

        const result = await parseAndImportDocentes(csv);

        try {
            await logAdminAction({
                action: "IMPORT",
                entity: "DOCENTE",
                detail: `Importacion CSV: ${result.success} docentes importados de ${result.total} filas`,
            });
        } catch (loggingError) {
            console.error("No fue posible registrar la importacion de docentes:", loggingError);
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error("Error importando docentes:", error);
        return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 });
    }
}
