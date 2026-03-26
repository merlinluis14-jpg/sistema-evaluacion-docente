import Papa from "papaparse";
import { prisma } from "@/lib/prisma";

type CsvRow = {
    nombre: string;
    codigo: string;
    cuatrimestre: string;
    carrera_code: string;
    numero_empleado: string; // del docente asignado
};

type ImportError = { row: number; identifier: string; reason: string };
type ImportResult = { total: number; success: number; errors: ImportError[] };

export async function parseAndImportMaterias(csvText: string): Promise<ImportResult> {
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
    const teacherCache = new Map<string, string>();

    for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2;
        const row = rows[i];

        const { nombre, codigo, cuatrimestre, carrera_code, numero_empleado } = row;
        const missing: string[] = [];
        if (!nombre) missing.push("nombre");
        if (!codigo) missing.push("codigo");
        if (!cuatrimestre) missing.push("cuatrimestre");
        if (!carrera_code) missing.push("carrera_code");
        if (!numero_empleado) missing.push("numero_empleado");

        if (missing.length > 0) {
            errors.push({ row: rowNum, identifier: codigo || "(vacío)", reason: `Campos faltantes: ${missing.join(", ")}` });
            continue;
        }

        const cuat = parseInt(cuatrimestre, 10);
        if (isNaN(cuat) || cuat < 1 || cuat > 12) {
            errors.push({ row: rowNum, identifier: codigo, reason: `Cuatrimestre inválido: "${cuatrimestre}"` });
            continue;
        }

        try {
            let careerId = careerCache.get(carrera_code.toUpperCase());
            if (!careerId) {
                const career = await prisma.career.findFirst({
                    where: { code: carrera_code.toUpperCase(), isActive: true },
                });
                if (!career) {
                    errors.push({ row: rowNum, identifier: codigo, reason: `Carrera "${carrera_code}" no existe` });
                    continue;
                }
                careerId = career.id;
                careerCache.set(carrera_code.toUpperCase(), careerId);
            }

            let teacherId = teacherCache.get(numero_empleado);
            if (!teacherId) {
                const teacher = await prisma.teacher.findUnique({
                    where: { employeeId: numero_empleado },
                });
                if (!teacher) {
                    errors.push({ row: rowNum, identifier: codigo, reason: `Docente con N° "${numero_empleado}" no existe` });
                    continue;
                }
                teacherId = teacher.id;
                teacherCache.set(numero_empleado, teacherId);
            }

            await prisma.subject.upsert({
                where: { code_careerId: { code: codigo.toUpperCase(), careerId } },
                update: { name: nombre, cuatrimestre: cuat, teacherId, isActive: true },
                create: {
                    name: nombre,
                    code: codigo.toUpperCase(),
                    cuatrimestre: cuat,
                    teacherId,
                    careerId,
                    isActive: true,
                },
            });

            success++;
        } catch (err: any) {
            errors.push({
                row: rowNum,
                identifier: codigo || "(vacío)",
                reason: err.message?.includes("Unique constraint")
                    ? "Código de materia duplicado en la misma carrera"
                    : `Error: ${err.message}`,
            });
        }
    }

    return { total: rows.length, success, errors };
}
