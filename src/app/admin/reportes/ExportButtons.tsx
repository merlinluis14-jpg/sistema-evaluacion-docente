"use client";
// src/app/admin/reportes/ExportButtons.tsx
// Client Component — maneja la exportación a PDF y Excel del reporte

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";

type DocenteReporte = {
  teacher: {
    id: string;
    name: string;
    lastName: string;
    position: "PA" | "PTC";
    career: { code: string; name: string };
  };
  totalEvals: number;
  facAvg: string;
  habAvg: string;
  medAvg: string;
  autoAvg: string;
  globalAvg: string;
  careerHeadAvg: string;
  institutionalScore: string;
  careerHeadEvaluation: {
    evaluatorName: string | null;
    comments: string | null;
    planCourseScore: number | null;
    competencyEvalScore: number | null;
    researchScore: number | null;
    tutoringScore: number | null;
    advisoryScore: number | null;
    platformUsageScore: number | null;
    problemSolvingScore: number | null;
    punctualityScore: number | null;
    teamworkScore: number | null;
  } | null;
  nivel: string;
  materias: string[];
};

type Props = {
  data: DocenteReporte[];
  periodo: string;
  canExportInstitutional: boolean;
};

export default function ExportButtons({ data, periodo, canExportInstitutional }: Props) {
  const [loadingStudentPdf, setLoadingStudentPdf] = useState(false);
  const [loadingInstitutionalPdf, setLoadingInstitutionalPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  // Generación de reporte CSV (Excel)
  const exportExcel = () => {
    setLoadingExcel(true);
    try {
      const headers = [
        "Docente", "Carrera", "Evaluaciones",
        "Prom. Facilitador (/4)", "Prom. Habilidades (/5)",
        "Prom. Medios (/5)", "Prom. Autoevaluación (/5)",
        "Promedio Global", "Nivel", "Materias evaluadas"
      ];

      const rows = data.map(d => [
        `${d.teacher.name} ${d.teacher.lastName}`,
        d.teacher.career.code,
        d.totalEvals,
        d.facAvg,
        d.habAvg,
        d.medAvg,
        d.autoAvg,
        d.globalAvg,
        d.nivel,
        d.materias.join(" | "),
      ]);

      const csvContent = [
        `Reporte de Evaluación Docente FDA-24.5 — ${periodo}`,
        `Generado el: ${new Date().toLocaleDateString("es-MX")}`,
        "",
        headers.join(","),
        ...rows.map(r => r.map(v => `"${v}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_evaluacion_${periodo.replace(/\s+/g, "_")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoadingExcel(false);
    }
  };

  // Llamada al servicio de exportación PDF
  const openHtmlInNewWindow = async (endpoint: string) => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, periodo }),
      });

      if (!res.ok) throw new Error("Error generando reporte");

      // Abrir el HTML en ventana nueva para imprimir como PDF
      const html = await res.text();
      const ventana = window.open("", "_blank");
      if (!ventana) {
        alert("Permite las ventanas emergentes para exportar el PDF");
        return;
      }
      ventana.document.write(html);
      ventana.document.close();

      // Esperar que cargue y abrir diálogo de impresión
      ventana.onload = () => {
        ventana.focus();
        ventana.print();
      };
    } catch (err) {
      console.error("Error exportando PDF:", err);
      alert("Error al generar el reporte. Intenta de nuevo.");
    }
  };

  const exportStudentPdf = async () => {
    setLoadingStudentPdf(true);
    try {
      await openHtmlInNewWindow("/api/reportes/pdf");
    } finally {
      setLoadingStudentPdf(false);
    }
  };

  const exportInstitutionalPdf = async () => {
    if (!canExportInstitutional) {
      alert("Selecciona un periodo específico para exportar el formato institucional.");
      return;
    }

    setLoadingInstitutionalPdf(true);
    try {
      await openHtmlInNewWindow("/api/reportes/pdf-institucional");
    } finally {
      setLoadingInstitutionalPdf(false);
    }
  };

  if (data.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      {/* Exportar Excel/CSV */}
      <button
        onClick={exportExcel}
        disabled={loadingExcel}
        className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100 active:scale-95 transition-all"
      >
        {loadingExcel ? (
          <span className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-600 rounded-full animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        Exportar Excel
      </button>

      {/* Exportar PDF alumnos */}
      <button
        onClick={exportStudentPdf}
        disabled={loadingStudentPdf}
        className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 active:scale-95 transition-all"
      >
        {loadingStudentPdf ? (
          <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-600 rounded-full animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        PDF alumnos
      </button>

      <button
        onClick={exportInstitutionalPdf}
        disabled={loadingInstitutionalPdf}
        className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingInstitutionalPdf ? (
          <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-600 rounded-full animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        PDF institucional
      </button>
    </div>
  );
}
