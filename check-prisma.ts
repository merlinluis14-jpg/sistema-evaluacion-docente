import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
    const teacher = await prisma.teacher.findFirst();
    console.log("Teacher keys:", teacher ? Object.keys(teacher) : "No teacher found");
    process.exit(0);
}

check();
