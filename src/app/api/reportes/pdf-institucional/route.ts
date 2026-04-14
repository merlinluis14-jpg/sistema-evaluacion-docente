import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  buildCareerHeadRows,
  buildInstitutionalFinalScore,
  getCareerHeadAverage,
  getTeacherPositionLabel,
  type TeacherPosition,
} from "@/lib/reportes";
import { getUptexLogoPublicPath } from "@/lib/pdf/uptexLogo";
import { formatAcademicText } from "@/lib/text/academicText";

type CareerHeadEvaluationPayload = {
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

type DocenteData = {
  teacher: {
    name: string;
    lastName: string;
    position: TeacherPosition;
  };
  contextCareer: { code: string; name: string };
  totalEvals: number;
  globalAvg: string;
  careerHeadAvg: string;
  institutionalScore: string;
  careerHeadEvaluation: CareerHeadEvaluationPayload;
};

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatScore(value: number | string, digits = 2) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) {
    return "0.00";
  }
  return numeric.toFixed(digits);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { data, periodo }: { data: DocenteData[]; periodo: string } = await req.json();

    const pages = data.map((teacherReport, index) => {
      const teacherName = `${teacherReport.teacher.name} ${teacherReport.teacher.lastName}`;
      const careerHeadAverage = teacherReport.careerHeadEvaluation
        ? getCareerHeadAverage(teacherReport.careerHeadEvaluation, teacherReport.teacher.position)
        : Number(teacherReport.careerHeadAvg) || 0;
      const studentAverage = Number(teacherReport.globalAvg) || 0;
      const finalScore = buildInstitutionalFinalScore(careerHeadAverage, studentAverage);
      const careerHeadRows = buildCareerHeadRows(
        teacherReport.careerHeadEvaluation,
        teacherReport.teacher.position,
      );
      const evaluatorName = teacherReport.careerHeadEvaluation?.evaluatorName?.trim() || "Pendiente de captura";
      const comments = teacherReport.careerHeadEvaluation?.comments?.trim()
        || "Sin comentarios registrados por coordinación.";

      return `
        ${index > 0 ? '<div class="page-break"></div>' : ""}
        <section class="sheet">
          <div class="logo-wrap">
            <img src="${getUptexLogoPublicPath()}" alt="UPTex" class="logo" />
          </div>
          <table class="main-header">
            <tr>
              <td colspan="3" class="title">Evaluación de Desempeño</td>
            </tr>
            <tr>
              <td>Área: Dirección Académica</td>
              <td>Vigencia: ${escapeHtml(periodo)}</td>
              <td>Código: FDA-24.5</td>
            </tr>
          </table>

          <table class="identity-table">
            <tr>
              <td class="label-cell">NOMBRE:</td>
              <td class="value-cell">${escapeHtml(teacherName)}</td>
              <td class="score-label">Calificación Final</td>
              <td class="score-final" rowspan="4">${formatScore(finalScore, 2)}</td>
            </tr>
            <tr>
              <td class="label-cell">PUESTO:</td>
              <td class="value-cell">${escapeHtml(teacherReport.teacher.position)} · ${escapeHtml(getTeacherPositionLabel(teacherReport.teacher.position))}</td>
              <td class="score-value">${formatScore(careerHeadAverage, 2)}</td>
            </tr>
            <tr>
              <td class="label-cell">EVALUADOR/A:</td>
              <td class="value-cell">${escapeHtml(evaluatorName)}</td>
              <td class="score-label">Calificación II. ESTUDIANTE</td>
            </tr>
            <tr>
              <td class="label-cell">PERÍODO A EVALUAR:</td>
              <td class="value-cell">${escapeHtml(periodo)}</td>
              <td class="score-value">${formatScore(studentAverage, 2)}</td>
            </tr>
          </table>

          <div class="section-title">Sección. Evaluación de la Presentación y Trabajo de Documentos</div>

          <table class="factors-table">
            <thead>
              <tr>
                <th>FACTOR</th>
                <th>DEFINICIÓN</th>
                <th>CALIF.</th>
              </tr>
            </thead>
            <tbody>
              ${careerHeadRows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.label)}</td>
                  <td>${escapeHtml(row.description)}</td>
                  <td class="score-cell">${escapeHtml(row.displayValue)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td class="summary-label">Sub total</td>
              <td>${formatScore(careerHeadAverage, 2)}</td>
              <td>${formatScore(studentAverage, 2)}</td>
              <td>${formatScore(finalScore, 2)}</td>
            </tr>
            <tr>
              <td class="summary-label">Calificación:</td>
              <td colspan="3" class="summary-final">${formatScore(finalScore, 2)}</td>
            </tr>
          </table>

          <table class="footer-table">
            <tr>
              <td>Elaborado por:</td>
              <td>${escapeHtml(evaluatorName)}</td>
            </tr>
            <tr>
              <td>Evaluaciones de alumnos:</td>
              <td>${teacherReport.totalEvals}</td>
            </tr>
            <tr>
              <td>Carrera:</td>
              <td>${escapeHtml(teacherReport.contextCareer.code)} · ${escapeHtml(formatAcademicText(teacherReport.contextCareer.name))}</td>
            </tr>
          </table>

          <table class="footer-table comments-table">
            <tr>
              <td>Comentarios del evaluador:</td>
              <td>${escapeHtml(comments)}</td>
            </tr>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p class="signature-name">${escapeHtml(evaluatorName)}</p>
              <p class="signature-role">Nombre y firma de quien elaboró</p>
            </div>
          </div>
        </section>
      `;
    }).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="color-scheme" content="light" />
          <title>Reporte institucional</title>
          <style>
            * { box-sizing: border-box; }
            html,
            body,
            table,
            thead,
            tbody,
            tr,
            td,
            th,
            div,
            p,
            span {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              font-size: 11px;
              color: #111827;
              background: #ffffff;
            }
            .sheet {
              width: 100%;
              padding: 18px 20px;
              background: #ffffff;
            }
            .logo-wrap {
              display: flex;
              justify-content: center;
              margin-bottom: 8px;
            }
            .logo {
              width: 108px;
              height: auto;
              object-fit: contain;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            td, th {
              border: 1px solid #6b7280;
              padding: 6px 7px;
              vertical-align: top;
            }
            .main-header .title {
              background: #1f5d3a;
              color: white;
              text-align: center;
              font-weight: 700;
              font-size: 15px;
              padding: 9px;
            }
            .main-header td {
              text-align: center;
              background: #f8fafc;
              font-size: 10px;
            }
            .identity-table {
              margin-top: 14px;
            }
            .label-cell {
              width: 15%;
              font-weight: 700;
              background: #f8fafc;
            }
            .value-cell {
              width: 55%;
            }
            .score-label {
              width: 15%;
              font-weight: 700;
              text-align: center;
              background: #f3f4f6;
            }
            .score-value,
            .score-cell {
              text-align: center;
              font-weight: 700;
            }
            .score-final {
              width: 15%;
              text-align: center;
              vertical-align: middle;
              font-size: 22px;
              font-weight: 700;
              background: #f8fafc;
            }
            .section-title {
              margin-top: 14px;
              padding: 7px 10px;
              border: 1px solid #6b7280;
              border-bottom: 0;
              text-align: center;
              font-weight: 700;
              background: #e5e7eb;
            }
            .factors-table th {
              background: #f3f4f6;
              text-align: left;
              font-size: 10px;
            }
            .factors-table th:last-child,
            .factors-table td:last-child {
              width: 12%;
              text-align: center;
            }
            .comments-cell {
              line-height: 1.4;
            }
            .summary-table {
              margin-top: 10px;
            }
            .summary-table td {
              text-align: center;
              font-weight: 700;
            }
            .summary-label {
              background: #f3f4f6;
              text-align: left !important;
              width: 22%;
            }
            .summary-final {
              font-size: 16px;
              background: #eef2ff;
            }
            .footer-table {
              margin-top: 14px;
            }
            .footer-table td:first-child {
              width: 25%;
              font-weight: 700;
              background: #f8fafc;
            }
            .comments-table {
              margin-top: 8px;
            }
            .comments-table td {
              line-height: 1.45;
            }
            .comments-table td:first-child {
              width: 25%;
            }
            .signature-section {
              margin-top: 28px;
              display: flex;
              justify-content: center;
            }
            .signature-box {
              width: 280px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #111827;
              margin-bottom: 8px;
            }
            .signature-name {
              margin: 0;
              font-size: 11px;
              font-weight: 700;
            }
            .signature-role {
              margin: 4px 0 0;
              font-size: 10px;
              color: #6b7280;
            }
            .page-break {
              page-break-before: always;
            }
            @page {
              size: letter;
              margin: 10mm;
            }
            @media print {
              html,
              body,
              table,
              thead,
              tbody,
              tr,
              td,
              th,
              div,
              p,
              span {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body {
                background: #ffffff !important;
              }
              .sheet {
                background: #ffffff !important;
              }
            }
          </style>
        </head>
        <body>${pages}</body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error exportando PDF institucional:", error);
    return NextResponse.json({ message: "No se pudo generar el PDF institucional" }, { status: 500 });
  }
}
