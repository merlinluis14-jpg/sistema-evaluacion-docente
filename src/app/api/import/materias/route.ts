import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseAndImportMaterias } from "@/lib/csv/parseMaterias";
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
                    parseAndImportMaterias(csv, { onProgress: emitProgress }),
                afterComplete: async (result) => {
                    await logAdminAction({
                        action: "IMPORT",
                        entity: "MATERIA",
                        detail: `Importacion CSV: ${result.success} materias importadas de ${result.total} filas`,
                    });
                },
            });
        }

        const result = await parseAndImportMaterias(csv);

        try {
            await logAdminAction({
                action: "IMPORT",
                entity: "MATERIA",
                detail: `Importacion CSV: ${result.success} materias importadas de ${result.total} filas`,
            });
        } catch (loggingError) {
            console.error("No fue posible registrar la importacion de materias:", loggingError);
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error("Error importando materias:", error);
        return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 });
    }
}
