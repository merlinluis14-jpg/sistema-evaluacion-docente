import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdminScope, getRestrictedCareerIds } from "@/lib/adminScope";
import { logAdminAction } from "@/lib/adminLog";
import { parseAndImportCareerHeadEvaluations } from "@/lib/csv/parseCareerHeadEvaluations";
import { createImportStreamResponse } from "@/lib/import/server";

export async function POST(req: NextRequest) {
  const scope = await getCurrentAdminScope();
  if (!scope) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const allowedCareerIds = getRestrictedCareerIds(scope);

  try {
    const { csv, periodId, stream } = await req.json();

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ message: "CSV requerido" }, { status: 400 });
    }

    if (!periodId || typeof periodId !== "string") {
      return NextResponse.json({ message: "Período requerido" }, { status: 400 });
    }

    if (stream) {
      return createImportStreamResponse({
        run: (emitProgress) =>
          parseAndImportCareerHeadEvaluations(csv, periodId, {
            onProgress: emitProgress,
            allowedCareerIds,
          }),
        afterComplete: async (result) => {
          await logAdminAction({
            action: "IMPORT",
            entity: "EVALUACION",
            detail: `Importación CSV jefatura: ${result.success} registros importados de ${result.total} filas`,
          });
        },
      });
    }

    const result = await parseAndImportCareerHeadEvaluations(csv, periodId, {
      allowedCareerIds,
    });

    try {
      await logAdminAction({
        action: "IMPORT",
        entity: "EVALUACION",
        detail: `Importación CSV jefatura: ${result.success} registros importados de ${result.total} filas`,
      });
    } catch (loggingError) {
      console.error("No fue posible registrar la importación de jefatura:", loggingError);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno";
    console.error("Error importando evaluación de jefatura:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
