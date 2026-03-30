"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type DetailItem = { label: string; valor: number; max: number };
type PdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };

type Props = {
  teacher: { name: string; lastName: string; employeeId: string; career: { name: string; code: string } };
  periodo: string;
  evaluacionesCount: number;
  promedios: { fac: number; hab: number; med: number; auto: number; global: number };
  nivel: string;
  facilitador: DetailItem[];
  habilidades: DetailItem[];
  medios: DetailItem[];
  autoevaluacion: DetailItem[];
};

export default function ExportTeacherPdf({ teacher, periodo, evaluacionesCount, promedios, nivel, facilitador, habilidades, medios, autoevaluacion }: Props) {
  const [loading, setLoading] = useState(false);

  const exportPdf = () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      
      const greenTheme: [number, number, number] = [15, 157, 88]; // Verde UPTX aprox
      const grayTheme: [number, number, number] = [160, 160, 160];

      // 1. Cabecera principal (Verde)
      autoTable(doc, {
        body: [["Evaluación de Desempeño"]],
        theme: "plain",
        styles: { fillColor: greenTheme, textColor: [255, 255, 255], fontStyle: "bold", halign: "center", fontSize: 14 },
        margin: { top: 15, left: 15, right: 15 },
      });

      // 2. Subcabecera (Gris)
      autoTable(doc, {
        body: [["Área: Dirección Académica", "Vigencia: 2026", "Código: FDA-24.5"]],
        theme: "plain",
        styles: { fillColor: grayTheme, textColor: [255, 255, 255], fontSize: 9, halign: "center" },
        margin: { top: 0, left: 15, right: 15 },
      });

      // 3. Bloque de Información del Docente
      autoTable(doc, {
        body: [
          ["NOMBRE:", `${teacher.name} ${teacher.lastName}`, "Evaluaciones recibidas:", evaluacionesCount.toString()],
          ["PUESTO:", "Docencia", "Promedio Global:", promedios.global.toString()],
          ["CARRERA:", teacher.career.name, "Nivel Alcanzado:", nivel],
          ["PERIODO A EVALUAR:", periodo, "Clave Docente:", teacher.employeeId],
        ],
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: [245, 245, 245], cellWidth: 40 },
          2: { fontStyle: "bold", fillColor: [245, 245, 245], cellWidth: 35 },
        },
        margin: { top: 5, left: 15, right: 15 },
      });

      // Función helper para renderizar secciones
      const addSection = (title: string, data: DetailItem[], maxScale: number) => {
        // Título de la sección
        autoTable(doc, {
          body: [[title]],
          theme: "grid",
          styles: { fillColor: [230, 230, 230], textColor: [50, 50, 50], fontStyle: "bold", halign: "center", fontSize: 9, lineColor: [200, 200, 200], lineWidth: 0.1 },
          margin: { top: 5, left: 15, right: 15 },
        });

        // Filas de datos
        const tableData = data.map(item => [item.label, `${item.valor} / ${maxScale}`]);
        autoTable(doc, {
          head: [["FACTOR / DEFINICIÓN", "CALIF."]],
          body: tableData,
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
          headStyles: { fillColor: [250, 250, 250], textColor: [50, 50, 50], fontStyle: "bold" },
          columnStyles: {
            1: { halign: "center", cellWidth: 30, fontStyle: "bold" }
          },
          margin: { top: 0, left: 15, right: 15 },
        });
      };

      addSection("Sección I. Facilitador del Aprendizaje", facilitador, 4);
      addSection("Sección II. Habilidades Didácticas", habilidades, 5);
      addSection("Sección III. Utilización de Medios Didácticos", medios, 5);
      addSection("Sección V. Autoevaluación del Alumno", autoevaluacion, 5);

      // Bloque final de firmas
      const finalY = ((doc as PdfWithAutoTable).lastAutoTable?.finalY ?? 180) + 20;
      
      doc.setFontSize(8);
      doc.text("Elaborado por:", 40, finalY);
      doc.line(70, finalY + 1, 140, finalY + 1); // Línea para firmar
      doc.text("Nombre y Firma", 90, finalY + 5);

      doc.save(`Evaluacion_${teacher.employeeId}_${periodo.replace(/\s+/g, "")}.pdf`);

    } catch (err) {
      console.error(err);
      alert("Error generando el formato oficial PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={exportPdf}
      disabled={loading}
      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 active:scale-95 transition-all outline-none disabled:opacity-50"
    >
      <Download size={16} />
      {loading ? "Generando PDF..." : "PDF Evaluación de Alumnos"}
    </button>
  );
}
