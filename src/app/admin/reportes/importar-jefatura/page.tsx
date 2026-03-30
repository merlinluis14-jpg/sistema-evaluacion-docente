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

type ImportError = { row: number; identifier: string; reason: string };
type ImportResult = { total: number; success: number; errors: ImportError[] };
type PeriodOption = { id: string; name: string; isActive: boolean };

const CSV_TEMPLATE = `nombre_docente,puesto,carrera_code,evaluador,elaborado_por,periodo_origen,plan_course_score,competency_eval_score,research_score,tutoring_score,advisory_score,platform_usage_score,problem_solving_score,punctuality_score,teamwork_score,resp_pe_avg,student_avg,source_final_avg,source_sheet,comments
ROBLES CANO FRANCISCO ISMAEL,PA,ISC,Edurnet Jhaquelin Luna Becerril,Edurnet Jhaquelin Luna Becerril,Mayo - Agosto 2025-2,5,3,N/A,N/A,N/A,4,4,5,4,4.1667,4.1,8.2667,CANO,Importado desde Excel institucional`;

export default function ImportarJefaturaPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
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
        setError("No fue posible cargar los periodos");
      });
  }, []);

  const handleFile = (nextFile: File) => {
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
  };

  const handleSubmit = async () => {
    if (!file || !periodId) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const csv = await file.text();
      const response = await fetch("/api/import/evaluacion-jefatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, periodId }),
      });

      if (!response.ok) {
        const serverError = await response.json();
        throw new Error(serverError.message || "Error en el servidor");
      }

      setResult(await response.json());
    } catch (submissionError: unknown) {
      setError(submissionError instanceof Error ? submissionError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "template_evaluacion_jefatura.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 pb-20 sm:p-12 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/admin/reportes"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={15} /> Volver a Reportes
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">
          Importar <span className="text-blue-600">Evaluacion de Jefatura</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Carga en bloque la evaluacion institucional extraida desde el archivo XLSX oficial de ISC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-black flex items-center justify-center">1</span>
                <h2 className="font-bold text-slate-700">Formato del archivo CSV</h2>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
              >
                <Download className="w-4 h-4" /> Descargar template
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <p>
                Este CSV se genera desde el script `scripts/export-career-head-from-xlsx.ps1` y conserva
                los puntajes institucionales del formato Excel por docente.
              </p>
              <p>
                El periodo del sistema se elige aqui al importar. El valor `periodo_origen` solo se guarda
                como referencia historica dentro de comentarios.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-black flex items-center justify-center">2</span>
              <h2 className="font-bold text-slate-700">Sube tu archivo CSV</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Periodo del sistema</label>
              <select
                value={periodId}
                onChange={(event) => setPeriodId(event.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              >
                <option value="">Selecciona un periodo</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} {period.isActive ? "• Activo" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                const droppedFile = event.dataTransfer.files[0];
                if (droppedFile) {
                  handleFile(droppedFile);
                }
              }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                dragOver
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
                onChange={(event) => {
                  if (event.target.files?.[0]) {
                    handleFile(event.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="space-y-1">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="font-bold text-emerald-700">{file.name}</p>
                  <p className="text-xs text-emerald-600">{(file.size / 1024).toFixed(1)} KB · Listo para importar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600">Arrastra tu CSV aqui</p>
                  <p className="text-sm text-slate-400">o haz clic para seleccionar</p>
                  <p className="text-xs text-slate-300 mt-2">Maximo 5 MB</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!file || !periodId || loading}
              className={`w-full py-3.5 rounded-xl text-sm font-black transition-all ${
                !file || !periodId || loading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] shadow-lg shadow-blue-500/20"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importando evaluacion de jefatura...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Iniciar Importacion
                </span>
              )}
            </button>
          </div>

          {result && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Resultado de la importacion
              </h2>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-700">{result.total}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Total filas</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-emerald-600">{result.success}</p>
                  <p className="text-xs text-emerald-500 font-medium mt-0.5">Importadas</p>
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

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {result.errors.length} fila(s) con errores
                  </p>
                  <div className="bg-slate-50 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="text-left px-4 py-2 font-bold text-slate-500">Fila</th>
                          <th className="text-left px-4 py-2 font-bold text-slate-500">Identificador</th>
                          <th className="text-left px-4 py-2 font-bold text-slate-500">Motivo</th>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
