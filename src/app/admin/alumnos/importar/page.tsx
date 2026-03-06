"use client";

import { useState, useRef } from "react";
import Link from "next/link";

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

// Formato del CSV esperado
const CSV_TEMPLATE = `matricula,nombre,apellido,email,carrera_code,grupo,password
220310001,Juan,García,j.garcia@uptex.edu.mx,ISC,3A,uptex2026
220310002,María,López,m.lopez@uptex.edu.mx,ISC,3A,uptex2026
220310003,Pedro,Martínez,,IET,5B,
220310004,Ana,Hernández,a.hernandez@uptex.edu.mx,IRO,2C,uptex2026`;

export default function ImportarAlumnosPage() {
    const [file, setFile] = useState<File | null>(null);
    const [periodo, setPeriodo] = useState("Enero-Abril 2026");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Selección de archivo
    const handleFile = (f: File) => {
        if (!f.name.endsWith(".csv")) {
            setError("El archivo debe ser formato CSV (.csv)");
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            setError("El archivo no puede superar 5 MB");
            return;
        }
        setFile(f);
        setError(null);
        setResult(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    // Envío a la API
    const handleSubmit = async () => {
        if (!file || !periodo.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const text = await file.text();
            const response = await fetch("/api/import/alumnos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csv: text, periodo: periodo.trim() }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Error en el servidor");
            }

            const data: ImportResult = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Error inesperado al importar");
        } finally {
            setLoading(false);
        }
    };

    // Descarga de plantilla
    const downloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "template_alumnos_uptx.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── UI ───────────────────────────────────────────────────────
    return (
        <div className="p-8 space-y-6 max-w-3xl">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/alumnos"
                    className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
                >
                    ← Volver a Alumnos
                </Link>
            </div>

            <div>
                <h1 className="text-3xl font-black text-slate-800">
                    Importar <span className="text-blue-600">Alumnos</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Carga masiva desde archivo CSV — los grupos se crean automáticamente
                </p>
            </div>

            {/* Selección de periodo */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-black flex items-center justify-center">1</span>
                    <h2 className="font-bold text-slate-700">Selecciona el periodo académico</h2>
                </div>
                <input
                    value={periodo}
                    onChange={e => setPeriodo(e.target.value)}
                    placeholder="Ej: Enero-Abril 2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                />
                <p className="text-xs text-slate-400">
                    Este valor se usa para crear o asignar los grupos del CSV a su periodo correspondiente.
                </p>
            </div>

            {/* Formato CSV */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-black flex items-center justify-center">2</span>
                        <h2 className="font-bold text-slate-700">Formato del archivo CSV</h2>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
                    >
                        ⬇️ Descargar template
                    </button>
                </div>

                {/* Columnas requeridas */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 rounded-xl">
                                <th className="text-left px-4 py-2 text-xs font-bold text-slate-500 rounded-l-xl">Columna</th>
                                <th className="text-center px-4 py-2 text-xs font-bold text-slate-500">Requerido</th>
                                <th className="text-left px-4 py-2 text-xs font-bold text-slate-500 rounded-r-xl">Descripción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[
                                ["matricula", true, "Matrícula institucional única — se usa para el login"],
                                ["nombre", true, "Nombre(s) del alumno"],
                                ["apellido", true, "Apellido(s) del alumno"],
                                ["email", false, "Email institucional (opcional)"],
                                ["carrera_code", true, "Código de carrera: ISC, IRO, IET, ILT, LAGE, LCIA"],
                                ["grupo", true, "Nombre del grupo: 3A, 5B, 2C — se crea si no existe"],
                                ["password", false, "Contraseña inicial — si se omite, se usa la matrícula"],
                            ].map(([col, req, desc]) => (
                                <tr key={col as string}>
                                    <td className="px-4 py-2">
                                        <code className="text-blue-600 font-bold text-xs bg-blue-50 px-2 py-0.5 rounded">
                                            {col as string}
                                        </code>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span className={`text-xs font-bold ${req ? "text-red-500" : "text-slate-400"}`}>
                                            {req ? "Sí" : "No"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs text-slate-500">{desc as string}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Preview del formato */}
                <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                    <p className="text-slate-400 text-[10px] font-bold mb-2 uppercase tracking-widest">Ejemplo</p>
                    <pre className="text-emerald-400 text-xs font-mono whitespace-pre leading-relaxed">
                        {`matricula,nombre,apellido,email,carrera_code,grupo,password
220310001,Juan,García,j.garcia@uptex.edu.mx,ISC,3A,uptex2026
220310002,María,López,,ISC,3A,
220310003,Pedro,Martínez,,IET,5B,uptex2026`}
                    </pre>
                </div>
            </div>

            {/* Subida de archivo */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-black flex items-center justify-center">3</span>
                    <h2 className="font-bold text-slate-700">Sube tu archivo CSV</h2>
                </div>

                {/* Drop zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver
                        ? "border-blue-400 bg-blue-50"
                        : file
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                    />

                    {file ? (
                        <div className="space-y-1">
                            <p className="text-3xl">✅</p>
                            <p className="font-bold text-emerald-700">{file.name}</p>
                            <p className="text-xs text-emerald-600">
                                {(file.size / 1024).toFixed(1)} KB · Listo para importar
                            </p>
                            <button
                                onClick={e => { e.stopPropagation(); setFile(null); }}
                                className="text-xs text-slate-400 hover:text-red-500 mt-2 underline"
                            >
                                Cambiar archivo
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-4xl">📂</p>
                            <p className="font-bold text-slate-600">
                                Arrastra tu CSV aquí
                            </p>
                            <p className="text-sm text-slate-400">
                                o haz clic para seleccionar
                            </p>
                            <p className="text-xs text-slate-300 mt-2">Máximo 5 MB</p>
                        </div>
                    )}
                </div>

                {/* Error de validación */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3">
                        <span className="text-red-500 mt-0.5">⚠️</span>
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                )}

                {/* Botón de importar */}
                <button
                    onClick={handleSubmit}
                    disabled={!file || !periodo.trim() || loading}
                    className={`w-full py-3.5 rounded-xl text-sm font-black transition-all ${!file || !periodo.trim() || loading
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] shadow-lg shadow-blue-500/20"
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Importando alumnos...
                        </span>
                    ) : (
                        "📤 Iniciar Importación"
                    )}
                </button>
            </div>

            {/* Resultados */}
            {result && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h2 className="font-bold text-slate-700">📊 Resultado de la importación</h2>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-slate-700">{result.total}</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Total filas</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-emerald-600">{result.success}</p>
                            <p className="text-xs text-emerald-500 font-medium mt-0.5">Importados</p>
                        </div>
                        <div className={`rounded-xl p-4 text-center ${result.errors.length > 0 ? "bg-red-50" : "bg-slate-50"}`}>
                            <p className={`text-2xl font-black ${result.errors.length > 0 ? "text-red-500" : "text-slate-400"}`}>
                                {result.errors.length}
                            </p>
                            <p className={`text-xs font-medium mt-0.5 ${result.errors.length > 0 ? "text-red-400" : "text-slate-400"}`}>
                                Errores
                            </p>
                        </div>
                    </div>

                    {/* Mensaje de éxito */}
                    {result.success > 0 && result.errors.length === 0 && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                            <p className="text-sm text-emerald-700 font-bold">
                                ✅ Todos los alumnos fueron importados correctamente
                            </p>
                        </div>
                    )}

                    {/* Errores detallados */}
                    {result.errors.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-bold text-red-600">
                                ⚠️ {result.errors.length} fila(s) con errores — el resto fue importado correctamente
                            </p>
                            <div className="bg-slate-50 rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="text-left px-4 py-2 font-bold text-slate-500">Fila</th>
                                            <th className="text-left px-4 py-2 font-bold text-slate-500">Matrícula</th>
                                            <th className="text-left px-4 py-2 font-bold text-slate-500">Motivo del error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {result.errors.map((err, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-2 text-slate-500">#{err.row}</td>
                                                <td className="px-4 py-2 font-mono text-slate-700">{err.matricula}</td>
                                                <td className="px-4 py-2 text-red-600">{err.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Acción siguiente */}
                    <div className="flex gap-3 pt-2">
                        <Link
                            href="/admin/alumnos"
                            className="flex-1 text-center py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-all"
                        >
                            Ver alumnos importados →
                        </Link>
                        <button
                            onClick={() => { setFile(null); setResult(null); }}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Nueva importación
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
