import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const periods = await prisma.period.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: { id: true, name: true, isActive: true },
  });

  return NextResponse.json(periods);
}
