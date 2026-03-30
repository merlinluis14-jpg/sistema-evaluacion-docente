import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { parseAndImportCareerHeadEvaluations } from "@/lib/csv/parseCareerHeadEvaluations";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const { csv, periodId } = await req.json();

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ message: "CSV requerido" }, { status: 400 });
    }

    if (!periodId || typeof periodId !== "string") {
      return NextResponse.json({ message: "Periodo requerido" }, { status: 400 });
    }

    const result = await parseAndImportCareerHeadEvaluations(csv, periodId);

    await logAdminAction({
      action: "IMPORT",
      entity: "EVALUACION",
      detail: `Importacion CSV jefatura: ${result.success} registros importados de ${result.total} filas`,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno";
    console.error("Error importando evaluacion de jefatura:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
