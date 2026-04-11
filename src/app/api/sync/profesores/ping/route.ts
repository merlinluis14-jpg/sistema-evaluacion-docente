import { NextResponse } from "next/server";
import { pingGestorApi } from "@/lib/gestorApi";

export async function GET() {
  const isUp = await pingGestorApi();
  if (isUp) {
    return NextResponse.json({
      status: "ok",
      message: "API academica activa",
    });
  } else {
    return NextResponse.json(
      {
        status: "error",
        message: "No se pudo conectar con la API academica",
      },
      { status: 503 },
    );
  }
}
