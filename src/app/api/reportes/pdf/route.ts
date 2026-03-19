// src/app/api/reportes/pdf/route.ts
// Genera el reporte de evaluación docente en PDF
// Usa el formato institucional UPTX con los resultados FDA-24.5

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Solo administradores pueden exportar reportes
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { data, periodo } = await req.json();

    const fecha = new Date().toLocaleDateString("es-MX", {
      year: "numeric", month: "long", day: "numeric"
    });

    // Generar HTML del reporte para convertir a PDF via print
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 24px; }

    /* Header institucional */
    .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 14px; font-weight: 900; color: #1e40af; }
    .header h2 { font-size: 12px; font-weight: 700; color: #334155; margin-top: 4px; }
    .header p  { font-size: 10px; color: #64748b; margin-top: 4px; }

    /* Resumen */
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
    .stat-box .num { font-size: 20px; font-weight: 900; color: #1e40af; }
    .stat-box .lbl { font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 2px; }

    /* Tabla */
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #1e293b; }
    thead th { color: white; padding: 8px 6px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
    thead th.center { text-align: center; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #eff6ff; }
    tbody td { padding: 8px 6px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
    tbody td.center { text-align: center; }
    tbody td.num { font-weight: 900; }

    /* Niveles */
    .badge { padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 700; }
    .badge-emerald { background: #d1fae5; color: #065f46; }
    .badge-blue    { background: #dbeafe; color: #1e40af; }
    .badge-amber   { background: #fef3c7; color: #92400e; }
    .badge-red     { background: #fee2e2; color: #991b1b; }
    .badge-slate   { background: #f1f5f9; color: #475569; }

    /* Escala de referencia */
    .escala { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
    .escala h3 { font-size: 10px; font-weight: 700; color: #334155; margin-bottom: 6px; }
    .escala-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .escala-item { text-align: center; font-size: 9px; }
    .escala-val { font-weight: 900; color: #1e40af; }

    /* Footer */
    .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }

    /* Firmas */
    .firmas { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 40px; }
    .firma { text-align: center; }
    .firma-linea { border-top: 1px solid #334155; padding-top: 6px; margin-top: 30px; font-size: 10px; }

    @media print { body { padding: 16px; } }
  </style>
</head>
<body>

  <!-- Header institucional -->
  <div class="header">
    <h1>Universidad Politécnica de Texcoco</h1>
    <h2>Reporte de Evaluación Docente — Instrumento FDA-24.5</h2>
    <p>Periodo: ${periodo} &nbsp;·&nbsp; Generado el: ${fecha}</p>
  </div>

  <!-- Estadísticas generales -->
  <div class="stats">
    <div class="stat-box">
      <div class="num">${data.length}</div>
      <div class="lbl">Docentes evaluados</div>
    </div>
    <div class="stat-box">
      <div class="num">${data.reduce((a: number, d: any) => a + d.totalEvals, 0)}</div>
      <div class="lbl">Total evaluaciones</div>
    </div>
    <div class="stat-box">
      <div class="num">${data.length > 0
        ? (data.reduce((a: number, d: any) => a + parseFloat(d.globalAvg), 0) / data.length).toFixed(2)
        : "—"
      }</div>
      <div class="lbl">Promedio institucional</div>
    </div>
  </div>

  <!-- Escala de referencia -->
  <div class="escala">
    <h3>Escala de calificación — Sección Facilitador e Habilidades</h3>
    <div class="escala-grid">
      <div class="escala-item"><span class="escala-val">E (4)</span> — Excelente</div>
      <div class="escala-item"><span class="escala-val">MB (3)</span> — Muy Bueno</div>
      <div class="escala-item"><span class="escala-val">B (2)</span> — Bueno</div>
      <div class="escala-item"><span class="escala-val">M (1)</span> — Malo</div>
    </div>
  </div>

  <!-- Tabla de resultados -->
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Docente</th>
        <th>Carrera</th>
        <th class="center">Evals.</th>
        <th class="center">Fac. /4</th>
        <th class="center">Hab. /5</th>
        <th class="center">Med. /5</th>
        <th class="center">Global</th>
        <th class="center">Nivel</th>
      </tr>
    </thead>
    <tbody>
      ${data.map((d: any, i: number) => `
        <tr>
          <td class="center">${i + 1}</td>
          <td><strong>${d.teacher.name} ${d.teacher.lastName}</strong></td>
          <td>${d.teacher.career.code}</td>
          <td class="center">${d.totalEvals}</td>
          <td class="center num">${d.facAvg}</td>
          <td class="center num">${d.habAvg}</td>
          <td class="center num">${d.medAvg}</td>
          <td class="center num">${d.globalAvg}</td>
          <td class="center">
            <span class="badge badge-${d.nivelColor}">${d.nivel}</span>
          </td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- Firmas -->
  <div class="firmas">
    <div class="firma">
      <div class="firma-linea">Coordinador Académico</div>
    </div>
    <div class="firma">
      <div class="firma-linea">Director de Carrera</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>Sistema de Evaluación Docente — UPTX &nbsp;·&nbsp; Instrumento FDA-24.5</span>
    <span>Documento generado automáticamente — ${fecha}</span>
  </div>

</body>
</html>`;

    // Retornar HTML para que el cliente lo imprima como PDF
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Error generando reporte PDF:", error);
    return NextResponse.json(
      { message: "Error interno generando el reporte" },
      { status: 500 }
    );
  }
}
