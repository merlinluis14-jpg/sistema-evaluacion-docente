"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  CloudDownload,
  RefreshCw,
  ServerCrash,
} from "lucide-react";

import type {
  ProfesorExterno,
  RespuestaProfesores,
  ResumenCatalogoAcademico,
} from "@/lib/gestorApi";

type ImportResult = {
  total: number;
  success: number;
  errors: { row: number; identifier: string; reason: string }[];
  deactivatedCount?: number;
  removedCount?: number;
};

type SyncResult = {
  careers: ImportResult;
  teachers: ImportResult;
  subjects: ImportResult;
  groups: ImportResult;
  assignments: ImportResult;
  warnings: string[];
  createdAccounts: number;
  skippedTeachers: number;
  skippedSubjects: number;
  skippedGroups: number;
  skippedAssignments: number;
  syncCatalogApplied: boolean;
  selectionSummary: {
    teachers: number;
    subjects: number;
    careers: number;
    groups: number;
    assignments: number;
  };
};

const EMPTY_SUMMARY: ResumenCatalogoAcademico = {
  carreras: 0,
  grupos: 0,
  materias: 0,
  relaciones: 0,
};

export default function SincronizarDocentesPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle",
  );
  const [pingStatus, setPingStatus] = useState<"checking" | "up" | "down">(
    "checking",
  );
  const [profesores, setProfesores] = useState<ProfesorExterno[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncCatalog, setSyncCatalog] = useState(false);
  const [previewSummary, setPreviewSummary] =
    useState<ResumenCatalogoAcademico>(EMPTY_SUMMARY);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);

  const isFullSelection =
    profesores.length > 0 && selectedIds.size === profesores.length;

  const fetchProfesores = async () => {
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/sync/profesores");
      if (!res.ok) {
        throw new Error("Error al obtener el catálogo académico externo");
      }

      const data: RespuestaProfesores = await res.json();
      setProfesores(data.profesores);
      setSelectedIds(new Set(data.profesores.map((profesor) => profesor.id)));
      setPreviewSummary(data.resumen);
      setPreviewWarnings(data.warnings);
      setStatus("idle");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al obtener el catálogo académico externo";
      setError(message);
      setStatus("error");
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch("/api/sync/profesores/ping");
        if (res.ok) {
          setPingStatus("up");
          await fetchProfesores();
        } else {
          setPingStatus("down");
        }
      } catch {
        setPingStatus("down");
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    if (!isFullSelection && syncCatalog) {
      setSyncCatalog(false);
    }
  }, [isFullSelection, syncCatalog]);

  const handleSync = async () => {
    if (selectedIds.size === 0) {
      setError("Selecciona al menos un docente para sincronizar.");
      return;
    }

    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/sync/profesores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncCatalog,
          selectedIds: Array.from(selectedIds),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error en sincronización");
      }

      setResult(data as SyncResult);
      await fetchProfesores();
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error en sincronización";
      setError(message);
      setStatus("error");
    }
  };

  const toggleSelection = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === profesores.length) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(profesores.map((profesor) => profesor.id)));
  };

  return (
    <div className="mx-auto max-w-7xl p-8 pb-20 sm:p-12">
      <div className="mb-2 flex items-center gap-4">
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
          href="/admin/docentes"
        >
          <ArrowLeft size={15} /> Volver a Docentes
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Sincronizar <span className="text-blue-600">Academia</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Actualiza en Evaluación Docente la información académica capturada
            previamente en Horarios.
          </p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold shadow-sm ${
            pingStatus === "checking"
              ? "border-slate-200 bg-slate-50 text-slate-500"
              : pingStatus === "up"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {pingStatus === "checking" ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : pingStatus === "up" ? (
            <Activity className="h-4 w-4" />
          ) : (
            <ServerCrash className="h-4 w-4" />
          )}

          {pingStatus === "checking"
            ? "Verificando conexión..."
            : pingStatus === "up"
              ? "Horarios disponible"
              : "Horarios no disponible"}
        </div>
      </div>

      {pingStatus === "down" && (
        <div className="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-bold text-rose-800">
            <AlertTriangle className="h-5 w-5" />
            No se pudo conectar con Horarios
          </h3>
          <p className="mt-2 text-sm text-rose-700">
            Revisa la configuración de la integración y confirma que el sistema
            de Horarios siga en línea.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95"
          >
            Reintentar conexión
          </button>
        </div>
      )}

      {pingStatus === "up" && (
        <>
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800 shadow-sm">
            Esta pantalla trae desde Horarios las carreras, los docentes, las
            materias, los grupos y las asignaciones por grupo. Antes de
            sincronizar, confirma que ya exista un período activo en Evaluación
            Docente.
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Docentes detectados
              </p>
              <p className="mt-2 text-3xl font-black text-slate-800">
                {profesores.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Carreras externas
              </p>
              <p className="mt-2 text-3xl font-black text-slate-800">
                {previewSummary.carreras}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Materias únicas
              </p>
              <p className="mt-2 text-3xl font-black text-slate-800">
                {previewSummary.materias}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Grupos
              </p>
              <p className="mt-2 text-3xl font-black text-slate-800">
                {previewSummary.grupos}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Asignaciones
              </p>
              <p className="mt-2 text-3xl font-black text-slate-800">
                {previewSummary.relaciones}
              </p>
            </div>
          </div>

          {previewWarnings.length > 0 && (
            <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Consideraciones de la vista previa
              </p>
              <ul className="space-y-2 text-sm text-amber-900">
                {previewWarnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="flex h-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
                  <h2 className="flex items-center gap-2 font-bold text-slate-700">
                    <CloudDownload className="h-5 w-5 text-blue-500" />
                    Docentes detectados en API Académica
                  </h2>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {profesores.length} docentes detectados
                  </span>
                </div>

                <div className="flex-1 overflow-auto p-0">
                  {profesores.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4 rounded-full bg-slate-100 p-3">
                      <CloudDownload className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-600">
                      No hay docentes disponibles para sincronizar
                    </p>
                    <p className="text-sm text-slate-400">
                      Horarios no devolvió docentes con materias y grupos activos.
                    </p>
                  </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white shadow-sm">
                        <tr className="bg-slate-50">
                          <th className="w-10 px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={
                                selectedIds.size === profesores.length &&
                                profesores.length > 0
                              }
                              onChange={toggleAll}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                            />
                          </th>
                          <th className="px-4 py-3 text-left font-bold text-slate-500">
                            Nombre
                          </th>
                          <th className="px-4 py-3 text-left font-bold text-slate-500">
                            Usuario
                          </th>
                          <th className="px-4 py-3 text-left font-bold text-slate-500">
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-left font-bold text-slate-500">
                            Carrera primaria
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profesores.map((profesor) => (
                          <tr
                            key={profesor.id}
                            className="transition-colors hover:bg-slate-50/50"
                          >
                            <td className="px-4 py-3 align-middle">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(profesor.id)}
                                onChange={() => toggleSelection(profesor.id)}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-700">
                                {profesor.nombre_completo}
                              </div>
                              <div className="text-xs text-slate-400">
                                {profesor.email}
                              </div>
                              <div className="mt-1 text-xs font-semibold text-blue-600">
                                {profesor.total_materias} materia(s) detectada(s)
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">
                              {profesor.username}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                                  profesor.tipo_profesor === "profesor_completo"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-sky-100 text-sky-700"
                                }`}
                              >
                                {profesor.tipo_profesor === "profesor_completo"
                                  ? "PTC"
                                  : "PA"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {profesor.carreras[0] ? (
                                <div>
                                  <div className="font-medium text-slate-700">
                                    {profesor.carreras[0].codigo} -{" "}
                                    {profesor.carreras[0].nombre}
                                  </div>
                                  {profesor.carreras.length > 1 && (
                                    <div className="text-xs text-amber-600">
                                      +{profesor.carreras.length - 1} carrera(s)
                                      adicional(es)
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="font-medium text-red-400">
                                  N/A
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  Opciones de sincronización
                </h2>

                <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  Esta acción actualiza los docentes seleccionados junto con sus
                  materias, grupos y relaciones del período activo.
                </div>

                <label className="mb-3 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={syncCatalog}
                    onChange={(event) => setSyncCatalog(event.target.checked)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 accent-amber-500"
                    disabled={status === "loading" || !isFullSelection}
                  />
                  <span className="text-sm text-amber-800">
                    <strong className="block">Actualizar catálogo completo</strong>
                    Solo esta opción aparece cuando seleccionas todo lo que hoy
                    existe en Horarios. Si la activas, el sistema retirará o
                    desactivará los registros que ya no formen parte del
                    catálogo académico vigente.
                  </span>
                </label>

                {!isFullSelection && profesores.length > 0 && (
                  <p className="mb-6 text-xs font-semibold text-amber-700">
                    La sincronización completa se desactiva automáticamente si
                    trabajas con una selección parcial.
                  </p>
                )}

                <div className="mb-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-black text-slate-700">
                      {selectedIds.size}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                      Docentes
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-black text-slate-700">
                      {
                        [...profesores].filter((profesor) =>
                          selectedIds.has(profesor.id),
                        ).length
                      }
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                      Seleccionados
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-black text-slate-700">
                      {previewSummary.materias}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                      Materias
                    </p>
                  </div>
                </div>

                <button
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition-all shadow-md ${
                    selectedIds.size === 0 || status === "loading"
                      ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 shadow-none"
                      : "bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700 active:scale-95"
                  }`}
                  disabled={selectedIds.size === 0 || status === "loading"}
                  onClick={handleSync}
                >
                  {status === "loading" ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <CloudDownload className="h-4 w-4" />
                      Sincronizar academia
                    </>
                  )}
                </button>

                {selectedIds.size === 0 && (
                  <p className="mt-2 text-center text-xs font-semibold text-rose-500">
                    Debes seleccionar al menos un docente.
                  </p>
                )}

                {error && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  </div>
                )}
              </div>

              {result && (
                <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-bold text-slate-700">
                    <BarChart2 className="h-4 w-4 text-emerald-500" />
                    Resultados
                  </h2>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-black text-slate-700">
                      {result.careers.success}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        Carreras
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-4 text-center">
                      <p className="text-2xl font-black text-emerald-600">
                        {result.teachers.success}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-emerald-600">
                        Docentes
                      </p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-4 text-center">
                      <p className="text-2xl font-black text-blue-700">
                        {result.subjects.success}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-blue-700">
                        Materias
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-sky-50 p-4 text-center">
                      <p className="text-2xl font-black text-sky-700">
                        {result.groups.success}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-sky-700">
                        Grupos
                      </p>
                    </div>
                    <div className="rounded-xl bg-cyan-50 p-4 text-center">
                      <p className="text-2xl font-black text-cyan-700">
                        {result.assignments.success}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-cyan-700">
                        Asignaciones
                      </p>
                    </div>
                    <div className="rounded-xl bg-violet-50 p-4 text-center">
                      <p className="text-2xl font-black text-violet-700">
                        {result.createdAccounts}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-violet-700">
                        Cuentas nuevas
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-4 text-center">
                      <p className="text-2xl font-black text-amber-700">
                        {result.skippedTeachers}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-amber-700">
                        Docentes omitidos
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-4 text-center">
                      <p className="text-2xl font-black text-amber-700">
                        {result.skippedSubjects}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-amber-700">
                        Materias omitidas
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-4 text-center">
                      <p className="text-2xl font-black text-amber-700">
                        {result.skippedGroups + result.skippedAssignments}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-amber-700">
                        Grupos/asignaciones omitidos
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                    Se preparó una actualización para{" "}
                    <strong>{result.selectionSummary.careers}</strong> carrera(s),{" "}
                    <strong>{result.selectionSummary.teachers}</strong> docente(s)
                    y <strong>{result.selectionSummary.subjects}</strong>{" "}
                    materia(s), <strong>{result.selectionSummary.groups}</strong>{" "}
                    grupo(s) y <strong>{result.selectionSummary.assignments}</strong>{" "}
                    asignación(es).
                    {result.syncCatalogApplied
                      ? " Se aplicó la actualización completa del catálogo."
                      : " Se actualizó solo la selección actual."}
                  </div>

                  {result.teachers.deactivatedCount !== undefined &&
                    result.teachers.deactivatedCount > 0 && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
                        <p className="text-sm font-bold text-amber-700">
                          {result.teachers.deactivatedCount} docente(s) local(es)
                          fueron desactivados.
                        </p>
                      </div>
                    )}

                  {result.careers.deactivatedCount !== undefined &&
                    result.careers.deactivatedCount > 0 && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
                        <p className="text-sm font-bold text-amber-700">
                          {result.careers.deactivatedCount} carrera(s) local(es)
                          quedaron inactivas porque todavía conservan historial.
                        </p>
                      </div>
                    )}

                  {result.careers.removedCount !== undefined &&
                    result.careers.removedCount > 0 && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                        <p className="text-sm font-bold text-emerald-700">
                          {result.careers.removedCount} carrera(s) obsoleta(s)
                          fueron retiradas del catálogo local.
                        </p>
                      </div>
                    )}

                  {result.subjects.deactivatedCount !== undefined &&
                    result.subjects.deactivatedCount > 0 && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
                        <p className="text-sm font-bold text-amber-700">
                          {result.subjects.deactivatedCount} materia(s) local(es)
                          fueron desactivadas.
                        </p>
                      </div>
                    )}

                  {result.groups.deactivatedCount !== undefined &&
                    result.groups.deactivatedCount > 0 && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
                        <p className="text-sm font-bold text-amber-700">
                          {result.groups.deactivatedCount} grupo(s) local(es)
                          fueron desactivados.
                        </p>
                      </div>
                    )}

                  {result.assignments.removedCount !== undefined &&
                    result.assignments.removedCount > 0 && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
                        <p className="text-sm font-bold text-amber-700">
                          {result.assignments.removedCount} asignación(es) de grupo
                          fueron retiradas por no existir ya en el sistema externo.
                        </p>
                      </div>
                    )}

                  {result.warnings.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        {result.warnings.length} advertencia(s)
                      </p>
                      <div className="max-h-48 overflow-auto rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900">
                        <ul className="space-y-2">
                          {result.warnings.map((warning, index) => (
                            <li key={`${warning}-${index}`}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {result.teachers.errors.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-rose-600">
                        <AlertTriangle className="h-4 w-4" />
                        Errores al sincronizar docentes
                      </p>
                      <div className="max-h-40 overflow-auto rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs">
                        <ul className="space-y-1">
                          {result.teachers.errors.map((item, index) => (
                            <li
                              key={`${item.identifier}-${index}`}
                              className="flex gap-2"
                            >
                              <span className="font-mono text-slate-400">
                                [{item.identifier}]
                              </span>
                              <span className="text-rose-600">
                                {item.reason}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {result.subjects.errors.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-rose-600">
                        <AlertTriangle className="h-4 w-4" />
                        Errores al sincronizar materias
                      </p>
                      <div className="max-h-40 overflow-auto rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs">
                        <ul className="space-y-1">
                          {result.subjects.errors.map((item, index) => (
                            <li
                              key={`${item.identifier}-${index}`}
                              className="flex gap-2"
                            >
                              <span className="font-mono text-slate-400">
                                [{item.identifier}]
                              </span>
                              <span className="text-rose-600">
                                {item.reason}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      href="/admin/docentes"
                      className="flex w-full justify-center rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      Ir al catálogo
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
