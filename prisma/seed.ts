// prisma/seed.ts
// Seed oficial del Sistema de Evaluación Docente — UPTX
// Datos verificados desde: http://sicoe.uptex.edu.mx/
// ============================================================

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// El proyecto usa PrismaPg como adaptador — el seed debe usarlo también
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Iniciando seed...\n");

    // ============================================================
    // 1. CARRERAS OFICIALES DE LA UPTX
    // Fuente: http://sicoe.uptex.edu.mx/
    // ============================================================
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

    // ============================================================
    // 2. USUARIO ADMINISTRADOR INICIAL
    // ⚠️ CAMBIAR LA CONTRASEÑA después del primer login
    // ============================================================
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
    console.log("   ⚠️  Cambiar la contraseña después del primer login\n");

    // ============================================================
    // 3. PERIODO DE EVALUACIÓN INICIAL
    // ============================================================
    console.log("📅 Creando periodo de evaluación...");

    await prisma.period.upsert({
        where: { id: "periodo-enero-abril-2026" },
        update: {},
        create: {
            id: "periodo-enero-abril-2026",
            name: "Cuatrimestre Enero-Abril 2026",
            startDate: new Date("2026-01-31"),
            endDate: new Date("2026-05-29"),
            isActive: false, // El admin lo activa manualmente desde /admin/periodos
        },
    });

    console.log("   ✓ Cuatrimestre Enero-Abril 2026 creado (inactivo)");
    console.log("   ℹ️  Activar desde /admin/periodos cuando corresponda\n");

    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    const [totalCarreras, totalUsers, totalPeriodos] = await Promise.all([
        prisma.career.count(),
        prisma.user.count(),
        prisma.period.count(),
    ]);

    console.log("═══════════════════════════════════════");
    console.log("✅ Seed completado exitosamente");
    console.log("═══════════════════════════════════════");
    console.log(`   Carreras:  ${totalCarreras}`);
    console.log(`   Usuarios:  ${totalUsers}`);
    console.log(`   Periodos:  ${totalPeriodos}`);
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
