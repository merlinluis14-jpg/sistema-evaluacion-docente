/**
 * API route for accessing active careers
 * Provides a read-only list of active careers strictly for use in client-side forms and dropdowns.
 */

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
