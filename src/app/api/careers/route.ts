// src/app/api/careers/route.ts
// Endpoint REST que devuelve todas las carreras activas
// Usado por los formularios client-side (ej: nuevo docente)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const careers = await prisma.career.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
    });
    return NextResponse.json(careers);
}
