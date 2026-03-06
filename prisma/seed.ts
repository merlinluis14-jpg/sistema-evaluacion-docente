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
    console.log("🌱 Iniciando seed...\n");

    // Carreras
    const carreras = [
        { code: "ISC", name: "Ingeniería en Sistemas Computacionales" },
        { code: "IRO", name: "Ingeniería en Robótica" },
        { code: "IET", name: "Ingeniería en Electrónica y Telecomunicaciones" },
        { code: "ILT", name: "Ingeniería en Logística y Transporte" },
        { code: "LAGE", name: "Licenciatura en Administración y Gestión Empresarial" },
        { code: "LCIA", name: "Licenciatura en Comercio Internacional y Aduanas" },
    ];

    console.log("📚 Creando carreras...");
    for (const carrera of carreras) {
        await prisma.career.upsert({
            where: { code: carrera.code },
            update: { name: carrera.name },
            create: carrera,
        });
        console.log(`   ✓ ${carrera.code} — ${carrera.name}`);
    }

    // Administrador por defecto
    console.log("\n👤 Creando administrador inicial...");

    const adminPassword = await bcrypt.hash("Admin@UPTX2026", 10);

    await prisma.user.upsert({
        where: { email: "admin@uptex.edu.mx" },
        update: {},
        create: {
            email: "admin@uptex.edu.mx",
            password: adminPassword,
            role: "ADMIN",
            isActive: true,
        },
    });

    console.log("   ✓ Admin creado");
    console.log("   📧 Email:      admin@uptex.edu.mx");
    console.log("   🔑 Contraseña: Admin@UPTX2026");
    console.log("   // TODO: Cambiar contraseña tras el primer login\n");

    // Periodo
    console.log("📅 Creando periodo de evaluación...");

    await prisma.period.upsert({
        where: { id: "periodo-enero-abril-2026" },
        update: {},
        create: {
            id: "periodo-enero-abril-2026",
            name: "Cuatrimestre Enero-Abril 2026",
            startDate: new Date("2026-01-31"),
            endDate: new Date("2026-05-29"),
            isActive: false, // Activar manualmente
        },
    });

    console.log("   ✓ Cuatrimestre Enero-Abril 2026 creado (inactivo)");
    console.log("   ℹ️  Activar desde /admin/periodos cuando corresponda\n");

    // Grupos de prueba
    console.log("👥 Creando grupos de prueba...");
    const dbCarreras = await prisma.career.findMany();
    const periodId = "periodo-enero-abril-2026";

    for (const carrera of dbCarreras) {
        // Creamos un par de grupos por carrera (ej: 3A, 6B)
        const groups = ["3A", "6B"];
        for (const gName of groups) {
            await prisma.group.upsert({
                where: { id: `${carrera.code}-${gName}-${periodId}` },
                update: {},
                create: {
                    id: `${carrera.code}-${gName}-${periodId}`,
                    name: gName,
                    period: "Enero-Abril 2026",
                    careerId: carrera.id,
                },
            });
        }
        console.log(`   ✓ Grupos creados para ${carrera.code}`);
    }

    // Alumno de prueba
    console.log("\n🎓 Creando alumno de prueba...");
    const isc = dbCarreras.find(c => c.code === "ISC");
    if (isc) {
        const studentPassword = await bcrypt.hash("password123", 10);
        const matricula = "122030001";
        const userAlumno = await prisma.user.upsert({
            where: { username: matricula },
            update: {},
            create: {
                username: matricula,
                password: studentPassword,
                role: "ALUMNO",
                isActive: true,
            },
        });

        await prisma.student.upsert({
            where: { userId: userAlumno.id },
            update: {},
            create: {
                userId: userAlumno.id,
                name: "Juan",
                lastName: "Pérez",
                matricula: matricula,
                careerId: isc.id,
            },
        });
        console.log(`   ✓ Alumno creado: ${matricula} / password123`);
    }

    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    const [totalCarreras, totalUsers, totalPeriodos, totalGrupos] = await Promise.all([
        prisma.career.count(),
        prisma.user.count(),
        prisma.period.count(),
        prisma.group.count(),
    ]);

    console.log("═══════════════════════════════════════");
    console.log("✅ Seed completado exitosamente");
    console.log("═══════════════════════════════════════");
    console.log(`   Carreras:  ${totalCarreras}`);
    console.log(`   Usuarios:  ${totalUsers}`);
    console.log(`   Periodos:  ${totalPeriodos}`);
    console.log(`   Grupos:    ${totalGrupos}`);
    console.log("═══════════════════════════════════════\n");
    console.log("🚀 Próximos pasos:");
    console.log("   1. Login en /login → admin@uptex.edu.mx / Admin@UPTX2026");
    console.log("   2. Crear docentes en /admin/docentes/nuevo");
    console.log("   3. Activar periodo en /admin/periodos\n");
}

main()
    .catch((e) => {
        console.error("❌ Error en el seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
