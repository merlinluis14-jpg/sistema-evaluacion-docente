require("dotenv/config");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs"); // bcryptjs is in package.json

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const career = await prisma.career.findFirst();
    if (!career) {
        console.log("NO CAREERS FOUND");
        return;
    }

    const hashed = await bcrypt.hash("password123", 10);
    const matricula = "10203040";

    const user = await prisma.user.upsert({
        where: { username: matricula },
        update: { password: hashed },
        create: {
            username: matricula,
            password: hashed,
            role: "ALUMNO",
        }
    });

    const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            name: "Alumno",
            lastName: "Prueba",
            matricula: matricula,
            careerId: career.id
        }
    });

    console.log("ALUMNO CREATED:", matricula, "password123");
}

main().catch(console.error).finally(() => {
    prisma.$disconnect();
    pool.end();
});
