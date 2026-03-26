import Papa from "papaparse";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type CsvRow = {
    nombre: string;
    apellido: string;
    email: string;
    numero_empleado: string;
    carrera_code: string;
    password?: string;
};

type ImportError = { row: number; identifier: string; reason: string };
type ImportResult = { total: number; success: number; errors: ImportError[] };

export async function parseAndImportDocentes(csvText: string): Promise<ImportResult> {
    const parsed = Papa.parse<CsvRow>(csvText.trim(), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
        transform: (v) => v.trim(),
    });

    const rows = parsed.data;
    const errors: ImportError[] = [];
    let success = 0;

    const careerCache = new Map<string, string>();

    for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2;
        const row = rows[i];

        const { nombre, apellido, email, numero_empleado, carrera_code } = row;
        const missing: string[] = [];
        if (!nombre) missing.push("nombre");
        if (!apellido) missing.push("apellido");
        if (!email) missing.push("email");
        if (!numero_empleado) missing.push("numero_empleado");
        if (!carrera_code) missing.push("carrera_code");

        if (missing.length > 0) {
            errors.push({ row: rowNum, identifier: numero_empleado || "(vacío)", reason: `Campos faltantes: ${missing.join(", ")}` });
            continue;
        }

        try {
            let careerId = careerCache.get(carrera_code.toUpperCase());
            if (!careerId) {
                const career = await prisma.career.findFirst({
                    where: { code: carrera_code.toUpperCase(), isActive: true },
                });
                if (!career) {
                    errors.push({ row: rowNum, identifier: numero_empleado, reason: `Carrera "${carrera_code}" no existe` });
                    continue;
                }
                careerId = career.id;
                careerCache.set(carrera_code.toUpperCase(), careerId);
            }

            const rawPassword = row.password?.trim() || numero_empleado;
            const hashedPassword = await bcrypt.hash(rawPassword, 10);

            const user = await prisma.user.upsert({
                where: { email },
                update: { isActive: true },
                create: {
                    email,
                    password: hashedPassword,
                    role: "DOCENTE",
                    isActive: true,
                },
            });

            await prisma.teacher.upsert({
                where: { employeeId: numero_empleado },
                update: { name: nombre, lastName: apellido, careerId, isActive: true },
                create: {
                    userId: user.id,
                    name: nombre,
                    lastName: apellido,
                    employeeId: numero_empleado,
                    careerId,
                    isActive: true,
                },
            });

            success++;
        } catch (err: any) {
            errors.push({
                row: rowNum,
                identifier: numero_empleado || "(vacío)",
                reason: err.message?.includes("Unique constraint")
                    ? "Email o número de empleado duplicado"
                    : `Error: ${err.message}`,
            });
        }
    }

    return { total: rows.length, success, errors };
}
