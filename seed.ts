// seed.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

import { prisma } from "./src/lib/prisma";

async function main() {

  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.upsert({
      where: { username: "122030001" },
      update: {
        password: hashedPassword,
      },
      create: {
        username: "122030001",
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    console.log("✅ Usuario administrador creado.");
  } catch (e) {
    console.error("❌ Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();