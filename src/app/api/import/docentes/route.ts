import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseAndImportDocentes } from "@/lib/csv/parseDocentes";
import { logAdminAction } from "@/lib/adminLog";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    try {
        const { csv } = await req.json();

        if (!csv || typeof csv !== "string") {
            return NextResponse.json({ message: "CSV requerido" }, { status: 400 });
        }

        const result = await parseAndImportDocentes(csv);

        await logAdminAction({
            action: "IMPORT", entity: "DOCENTE",
            detail: `Importación CSV: ${result.success} docentes importados de ${result.total} filas`,
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error("Error importando docentes:", error);
        return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 });
    }
}
