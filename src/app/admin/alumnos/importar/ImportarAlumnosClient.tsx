"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    BarChart2,
    CheckCircle2,
    Download,
    FolderOpen,
    Upload,
} from "lucide-react";
import ImportProgressPanel from "@/components/ui/ImportProgressPanel";
import { runStreamedImport } from "@/lib/import/client";
import type { ImportProgressState } from "@/lib/import/progress";

type ImportError = { row: number; matricula: string; reason: string };
type ImportResult = {
    total: number;
    success: number;
    errors: ImportError[];
    removedEnrollments?: number;
};

const CSV_TEMPLATE = `matricula,nombre,apellido,email,carrera_code,grupo,password
220310001,Juan,Garcia,j.garcia@uptx.edu.mx,ISC,3A,uptx2026
220310002,Maria,Lopez,m.lopez@uptx.edu.mx,ISC,3A,uptx2026
220310003,Pedro,Martinez,,IET,5B,
220310004,Ana,Hernandez,a.hernandez@uptx.edu.mx,IRO,2C,uptx2026`;

const EXAMPLE_PREVIEW = `matricula,nombre,apellido,email,carrera_code,grupo,password
220310001,Juan,Garcia,j.garcia@uptx.edu.mx,ISC,3A,uptx2026
220310002,Maria,Lopez,,ISC,3A,
220310003,Pedro,Martinez,,IET,5B,uptx2026`;

export default function ImportarAlumnosClient({ periodName }: { periodName: string }) {
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
                url: "/api/import/alumnos",
                body: { csv, periodo: periodName, syncCatalog },
                onProgress: setProgress,
            });
            setResult(nextResult);
        } catch (submissionError: unknown) {
            setError(
                submissionError instanceof Error
                    ? submissionError.message
                    : "Error inesperado al importar",
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
        anchor.download = "template_alumnos_uptx.csv";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-blue-700">
                    Periodo activo: <strong>{periodName}</strong>
                </span>
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
                                            Descripcion
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[
                                        ["matricula", true, "Matricula institucional unica; se usa para el login"],
                                        ["nombre", true, "Nombre(s) del alumno"],
                                        ["apellido", true, "Apellido(s) del alumno"],
                                        ["email", false, "Email institucional opcional"],
                                        ["carrera_code", true, "Codigo de carrera: ISC, IRO, IET, ILT, LAGE, LCIA"],
                                        ["grupo", true, "Nombre del grupo: 3A, 5B, 2C; se crea si no existe"],
                                        ["password", false, "Contrasena inicial; si se omite, se usa la matricula"],
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
                                    <p className="font-bold text-slate-600">Arrastra tu CSV aqui</p>
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
                            <ImportProgressPanel label="Importando alumnos" progress={progress} />
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
                                <strong className="block">Sincronizar roster del periodo activo</strong>
                                Si se activa, las asignaciones de grupo del periodo <strong>{periodName}</strong>
                                se reemplazaran con el contenido del CSV para las carreras importadas, sin borrar el historial.
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
                                    Importando alumnos... {progress?.percentage ?? 0}%
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Upload className="h-4 w-4" /> Iniciar importacion
                                </span>
                            )}
                        </button>
                    </div>

                    {result && (
                        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <h2 className="flex items-center gap-2 font-bold text-slate-700">
                                <BarChart2 className="h-4 w-4" /> Resultado de la importacion
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-slate-50 p-4 text-center">
                                    <p className="text-2xl font-black text-slate-700">{result.total}</p>
                                    <p className="mt-0.5 text-xs font-medium text-slate-400">Total filas</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-4 text-center">
                                    <p className="text-2xl font-black text-emerald-600">{result.success}</p>
                                    <p className="mt-0.5 text-xs font-medium text-emerald-500">Importados</p>
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
                                        Todos los alumnos fueron importados correctamente
                                    </p>
                                </div>
                            )}

                            {(result.removedEnrollments ?? 0) > 0 && (
                                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-bold text-amber-700">
                                        Sincronizacion aplicada: {result.removedEnrollments} asignacion(es) de grupo del periodo fueron retiradas por no aparecer en el CSV.
                                    </p>
                                </div>
                            )}

                            {result.errors.length > 0 && (
                                <div className="space-y-2">
                                    <p className="flex items-center gap-2 text-sm font-bold text-red-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        {result.errors.length} fila(s) con errores; el resto fue importado correctamente
                                    </p>
                                    <div className="overflow-hidden rounded-xl bg-slate-50">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="px-4 py-2 text-left font-bold text-slate-500">
                                                        Fila
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-bold text-slate-500">
                                                        Matricula
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-bold text-slate-500">
                                                        Motivo del error
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {result.errors.map((rowError, index) => (
                                                    <tr key={`${rowError.row}-${index}`}>
                                                        <td className="px-4 py-2 text-slate-500">#{rowError.row}</td>
                                                        <td className="px-4 py-2 font-mono text-slate-700">
                                                            {rowError.matricula}
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
                                    href="/admin/alumnos"
                                >
                                    Ver alumnos importados -&gt;
                                </Link>
                                <button
                                    className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                                    onClick={() => {
                                        setFile(null);
                                        setResult(null);
                                        setProgress(null);
                                    }}
                                >
                                    Nueva importacion
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
