"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  buildCareerHeadRows,
  buildInstitutionalFinalScore,
  getCareerHeadAverage,
  getTeacherPositionLabel,
} from "@/lib/reportes";

type DocenteReporte = {
  teacher: {
    id: string;
    name: string;
    lastName: string;
    position: "PA" | "PTC";
  };
  contextCareer: { id: string; code: string; name: string };
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

type PdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};

const COLORS = {
  uptxGreen: [0, 176, 80] as [number, number, number],
  darkGreen: [26, 107, 60] as [number, number, number],
  sectionGray: [217, 217, 217] as [number, number, number],
  headerGray: [242, 242, 242] as [number, number, number],
  lineGray: [107, 114, 128] as [number, number, number],
  finalBlue: [238, 242, 255] as [number, number, number],
  text: [17, 24, 39] as [number, number, number],
};

function formatScore(value: number, digits = 2) {
  if (Number.isNaN(value)) return "0.00";
  return value.toFixed(digits);
}

function drawBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: {
    fillColor?: [number, number, number];
    text?: string;
    fontSize?: number;
    bold?: boolean;
    align?: "left" | "center" | "right";
    textColor?: [number, number, number];
    paddingX?: number;
    paddingY?: number;
  },
) {
  doc.setDrawColor(...COLORS.lineGray);
  doc.setLineWidth(0.2);
  if (options?.fillColor) {
    doc.setFillColor(...options.fillColor);
    doc.rect(x, y, w, h, "FD");
  } else {
    doc.rect(x, y, w, h, "S");
  }

  if (!options?.text) return;

  doc.setTextColor(...(options.textColor ?? COLORS.text));
  doc.setFont("helvetica", options.bold ? "bold" : "normal");
  doc.setFontSize(options.fontSize ?? 8);

  const textWidth = w - ((options.paddingX ?? 2.5) * 2);
  const lines = doc.splitTextToSize(options.text, textWidth);
  const lineHeight = (options.fontSize ?? 8) * 0.3528 * 1.15;
  const textHeight = lines.length * lineHeight;
  const centerY = y + h / 2 + textHeight / 2 - lineHeight / 3;

  let textX = x + (options.paddingX ?? 2.5);
  if (options.align === "center") {
    textX = x + (w / 2);
  } else if (options.align === "right") {
    textX = x + w - (options.paddingX ?? 2.5);
  }

  doc.text(lines, textX, centerY, {
    align: options.align ?? "left",
    baseline: "alphabetic",
  });
}

function buildInstitutionalPdf(data: DocenteReporte[], periodo: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  }) as PdfWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  data.forEach((teacherReport, index) => {
    if (index > 0) {
      doc.addPage("letter", "portrait");
    }

    const teacherName = `${teacherReport.teacher.name} ${teacherReport.teacher.lastName}`;
    const evaluatorName = teacherReport.careerHeadEvaluation?.evaluatorName?.trim() || "Pendiente de captura";
    const comments = teacherReport.careerHeadEvaluation?.comments?.trim()
      || "Sin comentarios registrados por coordinacion.";
    const careerHeadAverage = teacherReport.careerHeadEvaluation
      ? getCareerHeadAverage(teacherReport.careerHeadEvaluation, teacherReport.teacher.position)
      : Number(teacherReport.careerHeadAvg) || 0;
    const studentAverage = Number(teacherReport.globalAvg) || 0;
    const finalScore = buildInstitutionalFinalScore(careerHeadAverage, studentAverage);
    const factorRows = buildCareerHeadRows(
      teacherReport.careerHeadEvaluation,
      teacherReport.teacher.position,
    );

    let currentY = 12;

    drawBox(doc, margin, currentY, contentWidth, 10, {
      fillColor: COLORS.uptxGreen,
      text: "Evaluacion de Desempeno",
      fontSize: 13,
      bold: true,
      align: "center",
      textColor: [255, 255, 255],
    });
    currentY += 10;

    const metaColWidth = contentWidth / 3;
    drawBox(doc, margin, currentY, metaColWidth, 8, {
      fillColor: COLORS.headerGray,
      text: "Area: Direccion Academica",
      fontSize: 7.5,
      align: "center",
    });
    drawBox(doc, margin + metaColWidth, currentY, metaColWidth, 8, {
      fillColor: COLORS.headerGray,
      text: `Vigencia: ${periodo}`,
      fontSize: 7.5,
      align: "center",
    });
    drawBox(doc, margin + (metaColWidth * 2), currentY, metaColWidth, 8, {
      fillColor: COLORS.headerGray,
      text: "Codigo: FDA-24.5",
      fontSize: 7.5,
      align: "center",
    });
    currentY += 12;

    const leftWidth = 132;
    const rightWidth = contentWidth - leftWidth;
    const labelWidth = 22;
    const rowHeight = 10;
    const smallScoreWidth = 26;
    const finalBlockWidth = rightWidth - smallScoreWidth;

    const leftRows = [
      { label: "NOMBRE:", value: teacherName },
      {
        label: "PUESTO:",
        value: `${teacherReport.teacher.position} - ${getTeacherPositionLabel(teacherReport.teacher.position)}`,
      },
      { label: "EVALUADOR/A:", value: evaluatorName },
      { label: "PERIODO A EVALUAR:", value: periodo },
    ];

    leftRows.forEach((row, rowIndex) => {
      drawBox(doc, margin, currentY + (rowIndex * rowHeight), labelWidth, rowHeight, {
        fillColor: COLORS.headerGray,
        text: row.label,
        fontSize: 7.5,
        bold: true,
      });
      drawBox(doc, margin + labelWidth, currentY + (rowIndex * rowHeight), leftWidth - labelWidth, rowHeight, {
        text: row.value,
        fontSize: 7.2,
      });
    });

    drawBox(doc, margin + leftWidth, currentY, smallScoreWidth, rowHeight, {
      fillColor: COLORS.headerGray,
      text: "Calificacion I.\nResp.PE",
      fontSize: 7.2,
      bold: true,
      align: "center",
    });
    drawBox(doc, margin + leftWidth, currentY + rowHeight, smallScoreWidth, rowHeight, {
      text: formatScore(careerHeadAverage),
      fontSize: 8.2,
      bold: true,
      align: "center",
    });
    drawBox(doc, margin + leftWidth, currentY + (rowHeight * 2), smallScoreWidth, rowHeight, {
      fillColor: COLORS.headerGray,
      text: "Calificacion II.\nESTUDIANTE",
      fontSize: 7.2,
      bold: true,
      align: "center",
    });
    drawBox(doc, margin + leftWidth, currentY + (rowHeight * 3), smallScoreWidth, rowHeight, {
      text: formatScore(studentAverage),
      fontSize: 8.2,
      bold: true,
      align: "center",
    });
    drawBox(doc, margin + leftWidth + smallScoreWidth, currentY, finalBlockWidth, rowHeight * 4, {
      text: formatScore(finalScore),
      fontSize: 18,
      bold: true,
      align: "center",
    });

    currentY += (rowHeight * 4) + 4;

    drawBox(doc, margin, currentY, contentWidth, 8, {
      fillColor: COLORS.sectionGray,
      text: "Seccion. Evaluacion de la Presentacion y Trabajo de Documentos",
      fontSize: 8,
      bold: true,
      align: "center",
    });
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      head: [["FACTOR", "DEFINICION", "CALIF."]],
      body: [
        ...factorRows.map((row) => [
          row.label,
          row.description,
          row.displayValue,
        ]),
        [
          {
            content: `COMENTARIOS: ${comments}`,
            colSpan: 2,
            styles: {
              halign: "left",
              fontStyle: "bold",
            },
          },
          {
            content: formatScore(careerHeadAverage),
            styles: { halign: "center", fontStyle: "bold" },
          },
        ],
      ],
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 1.6,
        lineColor: COLORS.lineGray,
        lineWidth: 0.2,
        textColor: COLORS.text,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: COLORS.headerGray,
        textColor: COLORS.text,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 38, fontStyle: "bold" },
        1: { cellWidth: 120 },
        2: { cellWidth: 22, halign: "center", fontStyle: "bold" },
      },
    });

    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 3;

    autoTable(doc, {
      startY: currentY,
      body: [
        ["Sub total", formatScore(careerHeadAverage), formatScore(studentAverage), formatScore(finalScore)],
        ["Calificacion:", { content: formatScore(finalScore), colSpan: 3, styles: { halign: "center", fontStyle: "bold", fillColor: COLORS.finalBlue, fontSize: 12 } }],
      ],
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 1.8,
        lineColor: COLORS.lineGray,
        lineWidth: 0.2,
        textColor: COLORS.text,
        halign: "center",
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 44, halign: "left", fillColor: COLORS.headerGray },
        1: { cellWidth: 46 },
        2: { cellWidth: 46 },
        3: { cellWidth: 56 },
      },
    });

    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 4;

    autoTable(doc, {
      startY: currentY,
      body: [
        ["Elaborado por:", evaluatorName],
        ["Evaluaciones de alumnos:", String(teacherReport.totalEvals)],
        ["Carrera:", `${teacherReport.contextCareer.code} - ${teacherReport.contextCareer.name}`],
      ],
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        lineColor: COLORS.lineGray,
        lineWidth: 0.2,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 40, fillColor: COLORS.headerGray, fontStyle: "bold" },
        1: { cellWidth: contentWidth - 40 },
      },
    });

    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 14;
    const signatureWidth = 80;
    const signatureX = (pageWidth - signatureWidth) / 2;

    doc.setDrawColor(...COLORS.text);
    doc.setLineWidth(0.2);
    doc.line(signatureX, currentY, signatureX + signatureWidth, currentY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);
    doc.text(evaluatorName, pageWidth / 2, currentY + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Nombre y firma de quien elaboro", pageWidth / 2, currentY + 9, { align: "center" });
  });

  doc.save(`reporte_institucional_${periodo.replace(/\s+/g, "_")}.pdf`);
}

function buildStudentPdf(data: DocenteReporte[], periodo: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  }) as PdfWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  data.forEach((teacherReport, index) => {
    if (index > 0) {
      doc.addPage("letter", "portrait");
    }

    const teacherName = `${teacherReport.teacher.name} ${teacherReport.teacher.lastName}`;
    const globalAverage = Number(teacherReport.globalAvg) || 0;
    const facAverage = Number(teacherReport.facAvg) || 0;
    const habAverage = Number(teacherReport.habAvg) || 0;
    const medAverage = Number(teacherReport.medAvg) || 0;
    const autoAverage = Number(teacherReport.autoAvg) || 0;

    let currentY = 12;

    drawBox(doc, margin, currentY, contentWidth, 10, {
      fillColor: COLORS.uptxGreen,
      text: "Evaluacion de Desempeno",
      fontSize: 13,
      bold: true,
      align: "center",
      textColor: [255, 255, 255],
    });
    currentY += 10;

    const metaColWidth = contentWidth / 3;
    drawBox(doc, margin, currentY, metaColWidth, 8, {
      fillColor: COLORS.headerGray,
      text: "Area: Direccion Academica",
      fontSize: 7.5,
      align: "center",
    });
    drawBox(doc, margin + metaColWidth, currentY, metaColWidth, 8, {
      fillColor: COLORS.headerGray,
      text: `Periodo: ${periodo}`,
      fontSize: 7.5,
      align: "center",
    });
    drawBox(doc, margin + (metaColWidth * 2), currentY, metaColWidth, 8, {
      fillColor: COLORS.headerGray,
      text: "Codigo: FDA-24.5",
      fontSize: 7.5,
      align: "center",
    });
    currentY += 12;

    const leftWidth = 132;
    const rightWidth = contentWidth - leftWidth;
    const labelWidth = 22;
    const rowHeight = 10;

    const leftRows = [
      { label: "NOMBRE:", value: teacherName },
      {
        label: "PUESTO:",
        value: `${teacherReport.teacher.position} - ${getTeacherPositionLabel(teacherReport.teacher.position)}`,
      },
      { label: "CARRERA:", value: `${teacherReport.contextCareer.code} - ${teacherReport.contextCareer.name}` },
      { label: "MATERIAS:", value: teacherReport.materias.join(", ") || "Sin materias visibles" },
    ];

    leftRows.forEach((row, rowIndex) => {
      drawBox(doc, margin, currentY + (rowIndex * rowHeight), labelWidth, rowHeight, {
        fillColor: COLORS.headerGray,
        text: row.label,
        fontSize: 7.5,
        bold: true,
      });
      drawBox(doc, margin + labelWidth, currentY + (rowIndex * rowHeight), leftWidth - labelWidth, rowHeight, {
        text: row.value,
        fontSize: 7.1,
      });
    });

    drawBox(doc, margin + leftWidth, currentY, rightWidth, rowHeight * 2, {
      fillColor: COLORS.headerGray,
      text: "Calificacion de alumnos",
      fontSize: 8,
      bold: true,
      align: "center",
    });
    drawBox(doc, margin + leftWidth, currentY + (rowHeight * 2), rightWidth, rowHeight * 2, {
      text: formatScore(globalAverage),
      fontSize: 18,
      bold: true,
      align: "center",
    });

    currentY += (rowHeight * 4) + 4;

    drawBox(doc, margin, currentY, contentWidth, 8, {
      fillColor: COLORS.sectionGray,
      text: "Resultados de evaluacion de alumnos",
      fontSize: 8,
      bold: true,
      align: "center",
    });
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      head: [["SECCION", "DESCRIPCION", "PROMEDIO"]],
      body: [
        [
          "Facilitador del aprendizaje",
          "Promedio general de orientacion, dominio del contenido, asesorias, respeto y puntualidad.",
          `${formatScore(facAverage)} /4`,
        ],
        [
          "Habilidades del facilitador",
          "Promedio de lenguaje, conduccion profesional, atencion al grupo y relacion con competencias.",
          `${formatScore(habAverage)} /5`,
        ],
        [
          "Medios didacticos",
          "Promedio de uso de pizarron, proyector, plataformas, guias y bibliografia.",
          `${formatScore(medAverage)} /5`,
        ],
        [
          "Autoevaluacion del alumno",
          "Promedio de participacion, preparacion y actividades realizadas por el alumno.",
          `${formatScore(autoAverage)} /5`,
        ],
        [
          "Resultado global",
          "Calificacion final obtenida a partir de las respuestas del instrumento FDA-24.5 aplicadas por alumnos.",
          `${formatScore(globalAverage)} /5`,
        ],
      ],
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: {
        fontSize: 7.2,
        cellPadding: 1.8,
        lineColor: COLORS.lineGray,
        lineWidth: 0.2,
        textColor: COLORS.text,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: COLORS.headerGray,
        textColor: COLORS.text,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: "bold" },
        1: { cellWidth: 118 },
        2: { cellWidth: 20, halign: "center", fontStyle: "bold" },
      },
    });

    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 4;

    autoTable(doc, {
      startY: currentY,
      body: [
        ["Evaluaciones registradas:", String(teacherReport.totalEvals)],
        ["Nivel de desempeno:", teacherReport.nivel],
        ["Periodo evaluado:", periodo],
      ],
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        lineColor: COLORS.lineGray,
        lineWidth: 0.2,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 42, fillColor: COLORS.headerGray, fontStyle: "bold" },
        1: { cellWidth: contentWidth - 42 },
      },
    });

    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 12;
    const signatureWidth = 70;
    const signatureX = margin + 50;

    doc.setDrawColor(...COLORS.text);
    doc.setLineWidth(0.2);
    doc.line(signatureX, currentY, signatureX + signatureWidth, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.text);
    doc.text("Reporte generado por el sistema", signatureX + (signatureWidth / 2), currentY + 5, { align: "center" });
    doc.text("Evaluacion de alumnos", signatureX + (signatureWidth / 2), currentY + 9, { align: "center" });
  });

  doc.save(`reporte_alumnos_${periodo.replace(/\s+/g, "_")}.pdf`);
}

export default function ExportButtons({ data, periodo, canExportInstitutional }: Props) {
  const [loadingStudentPdf, setLoadingStudentPdf] = useState(false);
  const [loadingInstitutionalPdf, setLoadingInstitutionalPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const exportExcel = () => {
    setLoadingExcel(true);
    try {
      const headers = [
        "Docente", "Carrera", "Evaluaciones",
        "Prom. Facilitador (/4)", "Prom. Habilidades (/5)",
        "Prom. Medios (/5)", "Prom. Autoevaluacion (/5)",
        "Promedio Global", "Nivel", "Materias evaluadas",
      ];

      const rows = data.map((teacherReport) => [
        `${teacherReport.teacher.name} ${teacherReport.teacher.lastName}`,
        teacherReport.contextCareer.code,
        teacherReport.totalEvals,
        teacherReport.facAvg,
        teacherReport.habAvg,
        teacherReport.medAvg,
        teacherReport.autoAvg,
        teacherReport.globalAvg,
        teacherReport.nivel,
        teacherReport.materias.join(" | "),
      ]);

      const csvContent = [
        `Reporte de Evaluacion Docente FDA-24.5 - ${periodo}`,
        `Generado el: ${new Date().toLocaleDateString("es-MX")}`,
        "",
        headers.join(","),
        ...rows.map((row) => row.map((value) => `"${value}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
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

  const exportStudentPdf = async () => {
    setLoadingStudentPdf(true);
    try {
      buildStudentPdf(data, periodo);
    } catch (error) {
      console.error("Error generando el PDF de alumnos:", error);
      alert("No se pudo generar el PDF de alumnos.");
    } finally {
      setLoadingStudentPdf(false);
    }
  };

  const exportInstitutionalPdf = async () => {
    if (!canExportInstitutional) {
      alert("Selecciona un periodo especifico para exportar el formato institucional.");
      return;
    }

    setLoadingInstitutionalPdf(true);
    try {
      buildInstitutionalPdf(data, periodo);
    } catch (error) {
      console.error("Error generando el PDF institucional:", error);
      alert("No se pudo generar el PDF institucional.");
    } finally {
      setLoadingInstitutionalPdf(false);
    }
  };

  if (data.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
