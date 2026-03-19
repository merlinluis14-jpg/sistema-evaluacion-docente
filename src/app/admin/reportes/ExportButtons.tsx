"use client";
// src/app/admin/reportes/ExportButtons.tsx
// Client Component — maneja la exportación a PDF y Excel del reporte

import { useState } from "react";

type DocenteReporte = {
  teacher: {
    id: string;
    name: string;
    lastName: string;
    career: { code: string; name: string };
  };
  totalEvals: number;
  facAvg: string;
  habAvg: string;
  medAvg: string;
  autoAvg: string;
  globalAvg: string;
  nivel: string;
  materias: string[];
};

type Props = {
  data: DocenteReporte[];
  periodo: string;
};

export default function ExportButtons({ data, periodo }: Props) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  // ── Exportar a CSV (compatible con Excel) ──────────────────
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

  // ── Exportar a PDF via API route ───────────────────────────
  const exportPdf = async () => {
    setLoadingPdf(true);
    try {
      const res = await fetch("/api/reportes/pdf", {
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
    } finally {
      setLoadingPdf(false);
    }
  };

  if (data.length === 0) return null;

  return (
    <div className="flex gap-2">
      {/* Exportar Excel/CSV */}
      <button
        onClick={exportExcel}
        disabled={loadingExcel}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100 active:scale-95 transition-all"
      >
        {loadingExcel ? (
          <span className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-600 rounded-full animate-spin" />
        ) : (
          <span>📊</span>
        )}
        Exportar Excel
      </button>

      {/* Exportar PDF */}
      <button
        onClick={exportPdf}
        disabled={loadingPdf}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 active:scale-95 transition-all"
      >
        {loadingPdf ? (
          <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-600 rounded-full animate-spin" />
        ) : (
          <span>📄</span>
        )}
        Exportar PDF
      </button>
    </div>
  );
}
