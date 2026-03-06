import Papa from "papaparse";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Tipos

type CsvRow = {
    matricula: string;
    nombre: string;
    apellido: string;
    email?: string;  // ignorado — el schema no lo tiene en Student
    carrera_code: string;
    grupo: string;
    password?: string;
};

type ImportError = {
    row: number;
    matricula: string;
    reason: string;
};

type ImportResult = {
    total: number;
    success: number;
    errors: ImportError[];
};

export async function parseAndImportAlumnos(
    csvText: string,
    periodo: string
): Promise<ImportResult> {
    const parsed = Papa.parse<CsvRow>(csvText.trim(), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
        transform: (v) => v.trim(),
    });

    const rows = parsed.data;
    const errors: ImportError[] = [];
    let success = 0;

    // Cache de carreras y grupos para optimizar consultas
    const careerCache = new Map<string, string>(); // code → careerId
    const groupCache = new Map<string, string>(); // `${careerId}:${grupoName}` → groupId

    // Proceso de filas
    for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2; // +1 header +1 base 1-indexed
        const row = rows[i];

        // Validación de campos
        const { matricula, nombre, apellido, carrera_code, grupo } = row;
        const missingFields: string[] = [];
        if (!matricula) missingFields.push("matricula");
        if (!nombre) missingFields.push("nombre");
        if (!apellido) missingFields.push("apellido");
        if (!carrera_code) missingFields.push("carrera_code");
        if (!grupo) missingFields.push("grupo");

        if (missingFields.length > 0) {
            errors.push({
                row: rowNum,
                matricula: matricula || "(vacío)",
                reason: `Campos requeridos faltantes: ${missingFields.join(", ")}`,
            });
            continue;
        }

        try {
            // Obtener carrera
            let careerId = careerCache.get(carrera_code.toUpperCase());
            if (!careerId) {
                const career = await prisma.career.findFirst({
                    where: { code: carrera_code.toUpperCase(), isActive: true },
                });
                if (!career) {
                    errors.push({
                        row: rowNum,
                        matricula,
                        reason: `Carrera "${carrera_code}" no existe o no está activa`,
                    });
                    continue;
                }
                careerId = career.id;
                careerCache.set(carrera_code.toUpperCase(), careerId);
            }

            // Obtener o crear grupo
            const groupKey = `${careerId}:${grupo.toUpperCase()}`;
            let groupId = groupCache.get(groupKey);
            if (!groupId) {
                const existingGroup = await prisma.group.findFirst({
                    where: {
                        careerId,
                        name: { equals: grupo, mode: "insensitive" },
                        period: periodo,
                    },
                });

                if (existingGroup) {
                    groupId = existingGroup.id;
                } else {
                    const newGroup = await prisma.group.create({
                        data: {
                            name: grupo.toUpperCase(),
                            period: periodo,
                            careerId,
                            isActive: true,
                        },
                    });
                    groupId = newGroup.id;
                }
                groupCache.set(groupKey, groupId);
            }

            // ── Hash de contraseña ────────────────────────────────
            const rawPassword = row.password?.trim() || matricula;
            const hashedPassword = await bcrypt.hash(rawPassword, 10);

            // Upsert de Usuario
            const user = await prisma.user.upsert({
                where: { username: matricula },
                update: { password: hashedPassword, isActive: true },
                create: {
                    username: matricula,
                    password: hashedPassword,
                    role: "ALUMNO",
                    isActive: true,
                },
            });

            // Upsert de Alumno
            const student = await prisma.student.upsert({
                where: { matricula },
                update: {
                    name: nombre,
                    lastName: apellido,
                    careerId,
                    isActive: true,
                },
                create: {
                    userId: user.id,
                    matricula,
                    name: nombre,
                    lastName: apellido,
                    careerId,
                    isActive: true,
                },
            });

            // Asignación al grupo
            await prisma.groupEnrollment.upsert({
                where: {
                    studentId_groupId: {
                        studentId: student.id,
                        groupId,
                    },
                },
                update: {},
                create: {
                    studentId: student.id,
                    groupId,
                },
            });

            success++;

        } catch (err: any) {
            errors.push({
                row: rowNum,
                matricula: matricula || "(vacío)",
                reason: err.message?.includes("Unique constraint")
                    ? "Matrícula duplicada en el CSV"
                    : `Error inesperado: ${err.message}`,
            });
        }
    }

    return {
        total: rows.length,
        success,
        errors,
    };
}
