"use client";

import { useEffect, useRef, useState } from "react";
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
type ImportResult = { total: number; success: number; errors: ImportError[] };
type PeriodOption = { id: string; name: string; isActive: boolean };

const EXAMPLE_PREVIEW = `numero_empleado,nombre_docente,puesto,carrera_code,evaluador,elaborado_por,plan_course_score,competency_eval_score,research_score,tutoring_score,advisory_score,platform_usage_score,problem_solving_score,punctuality_score,teamwork_score,comments
EMP1001,Juan Perez,PA,ISC,Dra. Maria Lopez,Dra. Maria Lopez,5,4,N/A,N/A,N/A,4,4,5,4,Buen cumplimiento general`;

export default function ImportarJefaturaPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ImportProgressState | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [periodId, setPeriodId] = useState("");

  useEffect(() => {
    void fetch("/api/admin/periodos")
      .then((response) => response.json())
      .then((data: PeriodOption[]) => {
        setPeriods(data);
        const active = data.find((period) => period.isActive);
        setPeriodId(active?.id ?? data[0]?.id ?? "");
      })
      .catch(() => {
        setError("No fue posible cargar los períodos");
      });
  }, []);

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

  const handleSubmit = async () => {
    if (!file || !periodId) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const csv = await file.text();
      const nextResult = await runStreamedImport<ImportResult>({
        url: "/api/import/evaluacion-jefatura",
        body: { csv, periodId },
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

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/admin/reportes/template-jefatura");
      if (!response.ok) {
        throw new Error("No fue posible generar la plantilla");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "template_evaluacion_coordinacion.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "No fue posible descargar la plantilla",
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-8 pb-20 sm:p-12">
      <div className="mb-2 flex items-center gap-4">
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
          href="/admin/reportes"
        >
          <ArrowLeft size={15} /> Volver a Reportes
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">
          Importar <span className="text-blue-600">Evaluación de Coordinación</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Carga en bloque la evaluación de la jefa de carrera o coordinación con una plantilla estándar del sistema.
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

            <div className="space-y-3 text-sm text-slate-600">
              <p>
                La plantilla se descarga precargada con los docentes activos, su número de empleado,
                tipo de docente y carrera para que solo captures las calificaciones.
              </p>
              <p>
                Para `PA` los campos `research_score`, `tutoring_score` y `advisory_score` salen como `N/A`.
                Para `PTC` esos campos quedan vacíos para que la coordinación los capture.
              </p>
              <div className="overflow-x-auto rounded-xl bg-slate-900 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Ejemplo
                </p>
                <pre className="whitespace-pre text-xs leading-relaxed text-emerald-400">
                  {EXAMPLE_PREVIEW}
                </pre>
              </div>
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

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500">
                Período del sistema
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setPeriodId(event.target.value)}
                value={periodId}
              >
                <option value="">Selecciona un período</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} {period.isActive ? "• Activo" : ""}
                  </option>
                ))}
              </select>
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
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                if (loading) return;
                const droppedFile = event.dataTransfer.files[0];
                if (droppedFile) {
                  handleFile(droppedFile);
                }
              }}
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
              <ImportProgressPanel
                label="Importando evaluación de coordinación"
                progress={progress}
              />
            )}

            <button
              className={`w-full rounded-xl py-3.5 text-sm font-black transition-all ${
                !file || !periodId || loading
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.99]"
              }`}
              disabled={!file || !periodId || loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Importando evaluación de coordinación... {progress?.percentage ?? 0}%
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
                    Todos los registros fueron importados correctamente
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
                          <th className="px-4 py-2 text-left font-bold text-slate-500">Fila</th>
                          <th className="px-4 py-2 text-left font-bold text-slate-500">
                            Identificador
                          </th>
                          <th className="px-4 py-2 text-left font-bold text-slate-500">Motivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.errors.map((item, index) => (
                          <tr key={`${item.row}-${index}`}>
                            <td className="px-4 py-2 text-slate-500">#{item.row}</td>
                            <td className="px-4 py-2 font-mono text-slate-700">{item.identifier}</td>
                            <td className="px-4 py-2 text-red-600">{item.reason}</td>
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
                  href="/admin/reportes"
                >
                  Volver a reportes -&gt;
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
