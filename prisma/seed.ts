import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Iniciando seed...\n");

    const periodId = "periodo-enero-abril-2026";
    const periodName = "Cuatrimestre Enero-Abril 2026";

    const carreras = [
        { code: "ISC", name: "Ingeniería en Sistemas Computacionales" },
        { code: "IRO", name: "Ingeniería en Robótica" },
        { code: "IET", name: "Ingeniería en Electrónica y Telecomunicaciones" },
        { code: "ILT", name: "Ingeniería en Logística y Transporte" },
        { code: "LAGE", name: "Licenciatura en Administración y Gestión Empresarial" },
        { code: "LCIA", name: "Licenciatura en Comercio Internacional y Aduanas" },
    ];

    console.log("Creando carreras...");
    for (const carrera of carreras) {
        await prisma.career.upsert({
            where: { code: carrera.code },
            update: {
                name: carrera.name,
                isActive: true,
            },
            create: {
                ...carrera,
                isActive: true,
            },
        });
        console.log(`  OK ${carrera.code} - ${carrera.name}`);
    }

    console.log("\nCreando administrador inicial...");
    const adminPassword = await bcrypt.hash("Admin@UPTX2026", 10);

    await prisma.user.upsert({
        where: { email: "admin@uptx.edu.mx" },
        update: {
            password: adminPassword,
            role: "ADMIN",
            isActive: true,
            adminHasGlobalScope: true,
        },
        create: {
            email: "admin@uptx.edu.mx",
            password: adminPassword,
            role: "ADMIN",
            isActive: true,
            adminHasGlobalScope: true,
        },
    });

    console.log("  OK Admin creado");
    console.log("  Email: admin@uptx.edu.mx");
    console.log("  Contrasena: Admin@UPTX2026");
    console.log("  Nota: cambiar contrasena tras el primer login.\n");

    console.log("Creando periodo de evaluacion...");
    await prisma.period.upsert({
        where: { id: periodId },
        update: {
            name: periodName,
            startDate: new Date("2026-01-31"),
            endDate: new Date("2026-05-29"),
            isActive: true,
        },
        create: {
            id: periodId,
            name: periodName,
            startDate: new Date("2026-01-31"),
            endDate: new Date("2026-05-29"),
            isActive: true,
        },
    });

    const [totalCarreras, totalUsuarios, totalPeriodos] = await Promise.all([
        prisma.career.count(),
        prisma.user.count(),
        prisma.period.count(),
    ]);

    console.log("  OK Cuatrimestre Enero-Abril 2026 creado y activo");
    console.log("  Estado base listo para importar tus propios CSV.\n");

    console.log("========================================");
    console.log("Seed completado exitosamente");
    console.log("========================================");
    console.log(`Carreras: ${totalCarreras}`);
    console.log(`Usuarios: ${totalUsuarios}`);
    console.log(`Periodos: ${totalPeriodos}`);
    console.log("========================================\n");
    console.log("Proximos pasos:");
    console.log("1. Login en /login -> admin@uptx.edu.mx / Admin@UPTX2026");
    console.log("2. Importar docentes, materias y alumnos");
    console.log("3. Ejecutar tu prueba manual completa\n");
}

main()
    .catch((error) => {
        console.error("Error en el seed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
