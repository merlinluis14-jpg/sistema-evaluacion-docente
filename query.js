require("dotenv/config");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const student = await prisma.user.findFirst({
        where: { role: 'ALUMNO' }
    });
    console.log("ALUMNO ENCONTRADO:", student);
}

main().catch(console.error).finally(() => {
    prisma.$disconnect();
    pool.end();
});
