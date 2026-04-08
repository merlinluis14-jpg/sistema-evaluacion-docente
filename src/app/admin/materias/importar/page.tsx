"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    BarChart2,
    CheckCircle2,
    Download,
    FolderOpen,
    Upload,
} from "lucide-react";
import ImportProgressPanel from "@/components/ui/ImportProgressPanel";
import { runStreamedImport } from "@/lib/import/client";
import type { ImportProgressState } from "@/lib/import/progress";

type ImportError = { row: number; identifier: string; reason: string };
type ImportResult = {
    total: number;
    success: number;
    errors: ImportError[];
    deactivatedCount?: number;
};

const CSV_TEMPLATE = `nombre,codigo,cuatrimestre,carrera_code,numero_empleado
Base de Datos I,ISC-BD1,3,ISC,DOC001
Programación Orientada a Objetos,ISC-POO,3,ISC,DOC002
Redes de Computadoras,ISC-RC1,5,ISC,DOC003`;

const EXAMPLE_PREVIEW = `nombre,codigo,cuatrimestre,carrera_code,numero_empleado
Base de Datos I,ISC-BD1,3,ISC,DOC001
Programación OO,ISC-POO,3,ISC,DOC002`;

export default function ImportarMateriasPage() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState<ImportProgressState | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [syncCatalog, setSyncCatalog] = useState(false);

    const handleFile = (nextFile: File) => {
        if (loading) return;
        if (!nextFile.name.endsWith(".csv")) {
            setError("El archivo debe ser formato CSV (.csv)");
            return;
        }
        if (nextFile.size > 5 * 1024 * 1024) {
            setError("El archivo no puede superar 5 MB");
            return;
        }

        setFile(nextFile);
        setError(null);
        setResult(null);
        setProgress(null);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setDragOver(false);
        if (loading) return;
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setProgress(null);

        try {
            const csv = await file.text();
            const nextResult = await runStreamedImport<ImportResult>({
                url: "/api/import/materias",
                body: { csv, syncCatalog },
                onProgress: setProgress,
            });
            setResult(nextResult);
        } catch (submissionError: unknown) {
            setError(
                submissionError instanceof Error
                    ? submissionError.message
                    : "Error inesperado",
            );
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "template_materias_uptx.csv";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="mx-auto max-w-7xl p-8 pb-20 sm:p-12">
            <div className="mb-2 flex items-center gap-4">
                <Link
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
                    href="/admin/materias"
                >
                    <ArrowLeft size={15} /> Volver a Materias
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800">
                    Importar <span className="text-blue-600">Materias</span>
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                    Carga masiva de materias desde archivo CSV; los docentes deben existir previamente
                </p>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
                <div className="flex flex-col">
                    <div className="h-full space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                                    1
                                </span>
                                <h2 className="font-bold text-slate-700">Formato del archivo CSV</h2>
                            </div>
                            <button
                                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50"
                                onClick={downloadTemplate}
                            >
                                <Download className="h-4 w-4" /> Descargar template
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="rounded-l-xl px-4 py-2 text-left text-xs font-bold text-slate-500">
                                            Columna
                                        </th>
                                        <th className="px-4 py-2 text-center text-xs font-bold text-slate-500">
                                            Requerido
                                        </th>
                                        <th className="rounded-r-xl px-4 py-2 text-left text-xs font-bold text-slate-500">
                                            Descripción
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[
                                        ["nombre", true, "Nombre completo de la materia"],
                                        ["codigo", true, "Código único por carrera: ISC-BD1, ISC-POO"],
                                        ["cuatrimestre", true, "Número de cuatrimestre (1-12)"],
                                        ["carrera_code", true, "Código de carrera: ISC, IRO, IET, ILT, LAGE, LCIA"],
                                        ["numero_empleado", true, "Número de empleado del docente asignado"],
                                    ].map(([column, required, description]) => (
                                        <tr key={column as string}>
                                            <td className="px-4 py-2">
                                                <code className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
                                                    {column as string}
                                                </code>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span
                                                    className={`text-xs font-bold ${
                                                        required ? "text-red-500" : "text-slate-400"
                                                    }`}
                                                >
                                                    {required ? "Si" : "No"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-xs text-slate-500">
                                                {description as string}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-1 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                                2
                            </span>
                            <h2 className="font-bold text-slate-700">Sube tu archivo CSV</h2>
                        </div>

                        <div className="overflow-x-auto rounded-xl bg-slate-900 p-4">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Ejemplo
                            </p>
                            <pre className="whitespace-pre text-xs leading-relaxed text-emerald-400">
                                {EXAMPLE_PREVIEW}
                            </pre>
                        </div>

                        <div
                            className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                                loading
                                    ? "pointer-events-none opacity-70"
                                    : dragOver
                                      ? "border-blue-400 bg-blue-50"
                                      : file
                                        ? "border-emerald-400 bg-emerald-50"
                                        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                            }`}
                            onClick={() => {
                                if (!loading) {
                                    inputRef.current?.click();
                                }
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDragOver={(event) => {
                                event.preventDefault();
                                if (!loading) {
                                    setDragOver(true);
                                }
                            }}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={inputRef}
                                accept=".csv"
                                className="hidden"
                                disabled={loading}
                                onChange={(event) => {
                                    if (event.target.files?.[0]) {
                                        handleFile(event.target.files[0]);
                                    }
                                }}
                                type="file"
                            />

                            {file ? (
                                <div className="space-y-1">
                                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                                    <p className="font-bold text-emerald-700">{file.name}</p>
                                    <p className="text-xs text-emerald-600">
                                        {(file.size / 1024).toFixed(1)} KB · Listo para importar
                                    </p>
                                    {!loading && (
                                        <button
                                            className="mt-2 text-xs text-slate-400 underline hover:text-red-500"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setFile(null);
                                                setProgress(null);
                                            }}
                                        >
                                            Cambiar archivo
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <FolderOpen className="mx-auto h-10 w-10 text-slate-300" />
                                    <p className="font-bold text-slate-600">Arrastra tu CSV aquí</p>
                                    <p className="text-sm text-slate-400">o haz clic para seleccionar</p>
                                    <p className="mt-2 text-xs text-slate-300">Maximo 5 MB</p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                <p className="text-sm font-medium text-red-600">{error}</p>
                            </div>
                        )}

                        {loading && progress && (
                            <ImportProgressPanel label="Importando materias" progress={progress} />
                        )}

                        <label className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                            <input
                                type="checkbox"
                                checked={syncCatalog}
                                onChange={(event) => setSyncCatalog(event.target.checked)}
                                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-amber-500"
                                disabled={loading}
                            />
                            <span className="text-sm text-amber-800">
                                <strong className="block">Sincronizar catálogo importado</strong>
                                Si se activa, las materias activas de las carreras incluidas que no
                                aparezcan en el CSV se desactivarán para reemplazar el catálogo.
                            </span>
                        </label>

                        <button
                            className={`w-full rounded-xl py-3.5 text-sm font-black transition-all ${
                                !file || loading
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.99]"
                            }`}
                            disabled={!file || loading}
                            onClick={handleSubmit}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Importando materias... {progress?.percentage ?? 0}%
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Upload className="h-4 w-4" /> Iniciar importación
                                </span>
                            )}
                        </button>
                    </div>

                    {result && (
                        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <h2 className="flex items-center gap-2 font-bold text-slate-700">
                                <BarChart2 className="h-4 w-4" /> Resultado de la importación
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-slate-50 p-4 text-center">
                                    <p className="text-2xl font-black text-slate-700">{result.total}</p>
                                    <p className="mt-0.5 text-xs font-medium text-slate-400">Total filas</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-4 text-center">
                                    <p className="text-2xl font-black text-emerald-600">{result.success}</p>
                                    <p className="mt-0.5 text-xs font-medium text-emerald-500">Importadas</p>
                                </div>
                                <div
                                    className={`rounded-xl p-4 text-center ${
                                        result.errors.length > 0 ? "bg-red-50" : "bg-slate-50"
                                    }`}
                                >
                                    <p
                                        className={`text-2xl font-black ${
                                            result.errors.length > 0 ? "text-red-500" : "text-slate-400"
                                        }`}
                                    >
                                        {result.errors.length}
                                    </p>
                                    <p
                                        className={`mt-0.5 text-xs font-medium ${
                                            result.errors.length > 0 ? "text-red-400" : "text-slate-400"
                                        }`}
                                    >
                                        Errores
                                    </p>
                                </div>
                            </div>

                            {result.success > 0 && result.errors.length === 0 && (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                    <p className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Todas las materias fueron importadas correctamente
                                    </p>
                                </div>
                            )}

                            {(result.deactivatedCount ?? 0) > 0 && (
                                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-bold text-amber-700">
                                        Sincronización aplicada: {result.deactivatedCount} materia(s) fueron desactivadas por no aparecer en el CSV.
                                    </p>
                                </div>
                            )}

                            {result.errors.length > 0 && (
                                <div className="space-y-2">
                                    <p className="flex items-center gap-2 text-sm font-bold text-red-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        {result.errors.length} fila(s) con errores
                                    </p>
                                    <div className="overflow-hidden rounded-xl bg-slate-50">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="px-4 py-2 text-left font-bold text-slate-500">
                                                        Fila
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-bold text-slate-500">
                                                        Código
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-bold text-slate-500">
                                                        Motivo
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {result.errors.map((rowError, index) => (
                                                    <tr key={`${rowError.row}-${index}`}>
                                                        <td className="px-4 py-2 text-slate-500">#{rowError.row}</td>
                                                        <td className="px-4 py-2 font-mono text-slate-700">
                                                            {rowError.identifier}
                                                        </td>
                                                        <td className="px-4 py-2 text-red-600">
                                                            {rowError.reason}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Link
                                    className="flex-1 rounded-xl bg-blue-700 py-2.5 text-center text-sm font-bold text-white transition-all hover:bg-blue-800"
                                    href="/admin/materias"
                                >
                                    Ver materias importadas -&gt;
                                </Link>
                                <button
                                    className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                                    onClick={() => {
                                        setFile(null);
                                        setResult(null);
                                        setProgress(null);
                                    }}
                                >
                                    Nueva importación
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
