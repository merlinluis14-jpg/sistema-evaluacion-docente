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
            update: { name: carrera.name },
            create: carrera,
        });
        console.log(`  OK ${carrera.code} - ${carrera.name}`);
    }

    console.log("\nCreando administrador inicial...");
    const adminPassword = await bcrypt.hash("Admin@UPTX2026", 10);

    await prisma.user.upsert({
        where: { email: "admin@uptx.edu.mx" },
        update: {},
        create: {
            email: "admin@uptx.edu.mx",
            password: adminPassword,
            role: "ADMIN",
            isActive: true,
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

    console.log("  OK Cuatrimestre Enero-Abril 2026 creado y activo");
    console.log("  Listo para importar catalogos y ejecutar pruebas manuales.\n");

    console.log("Creando grupos base de prueba...");
    const dbCarreras = await prisma.career.findMany();

    for (const carrera of dbCarreras) {
        for (const gName of ["3A", "6B"]) {
            await prisma.group.upsert({
                where: { id: `${carrera.code}-${gName}-${periodId}` },
                update: {
                    name: gName,
                    period: periodName,
                    careerId: carrera.id,
                    isActive: true,
                },
                create: {
                    id: `${carrera.code}-${gName}-${periodId}`,
                    name: gName,
                    period: periodName,
                    careerId: carrera.id,
                    isActive: true,
                },
            });
        }

        console.log(`  OK Grupos creados para ${carrera.code}`);
    }

    console.log("\nCreando alumno de prueba...");
    const isc = dbCarreras.find((c) => c.code === "ISC");
    if (isc) {
        const studentPassword = await bcrypt.hash("password123", 10);
        const matricula = "122030001";

        const userAlumno = await prisma.user.upsert({
            where: { username: matricula },
            update: {
                password: studentPassword,
                role: "ALUMNO",
                isActive: true,
                canChangeInitialPassword: true,
            },
            create: {
                username: matricula,
                password: studentPassword,
                role: "ALUMNO",
                isActive: true,
                canChangeInitialPassword: true,
            },
        });

        await prisma.student.upsert({
            where: { userId: userAlumno.id },
            update: {
                name: "Juan",
                lastName: "Perez",
                matricula,
                careerId: isc.id,
                isActive: true,
            },
            create: {
                userId: userAlumno.id,
                name: "Juan",
                lastName: "Perez",
                matricula,
                careerId: isc.id,
                isActive: true,
            },
        });

        console.log(`  OK Alumno creado: ${matricula} / password123`);
    }

    const [totalCarreras, totalUsers, totalPeriodos, totalGrupos] = await Promise.all([
        prisma.career.count(),
        prisma.user.count(),
        prisma.period.count(),
        prisma.group.count(),
    ]);

    console.log("\n========================================");
    console.log("Seed completado exitosamente");
    console.log("========================================");
    console.log(`Carreras: ${totalCarreras}`);
    console.log(`Usuarios: ${totalUsers}`);
    console.log(`Periodos: ${totalPeriodos}`);
    console.log(`Grupos: ${totalGrupos}`);
    console.log("========================================\n");
    console.log("Proximos pasos:");
    console.log("1. Login en /login -> admin@uptx.edu.mx / Admin@UPTX2026");
    console.log("2. Importar docentes, materias y alumnos");
    console.log("3. Ejecutar la prueba manual completa\n");
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
