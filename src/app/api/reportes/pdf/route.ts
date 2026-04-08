import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type DocenteData = {
  teacher: {
    name: string;
    lastName: string;
  };
  contextCareer: { code: string; name: string };
  totalEvals: number;
  facAvg: string;
  habAvg: string;
  medAvg: string;
  autoAvg: string;
  globalAvg: string;
  nivel: string;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { data, periodo }: { data: DocenteData[]; periodo: string } = await req.json();

    const fecha = new Date().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const paginasDocentes = data.map((docente, idx) => {
      const nombre = `${docente.teacher.name} ${docente.teacher.lastName}`;
      const calIF = (parseFloat(docente.facAvg) / 4 * 10).toFixed(1);
      const calIIE = (parseFloat(docente.globalAvg) / 5 * 10).toFixed(1);
      const calFinal = ((parseFloat(calIF) * 0.4) + (parseFloat(calIIE) * 0.6)).toFixed(1);

      const factoresFac = [
        "Orientación inicial sobre unidades de aprendizaje",
        "Dominio de los contenidos de la materia",
        "Resumen de temas por sesión y unidad",
        "Aclaración de dudas y asesorías",
        "Entrega oportuna de resultados de examen",
        "Logro de objetivos del cuatrimestre",
        "Promoción de respeto y disciplina",
        "Puntualidad y manejo del tiempo en clase",
      ];

      const factoresHab = [
        "Manejo del lenguaje apropiado de la asignatura",
        "Conducción al desarrollo profesional del alumno",
        "Capacidad para captar la atención del grupo",
        "Relación de contenidos con competencias del modelo educativo",
      ];

      const factoresMed = [
        "Uso de medios didácticos (pizarrón, cañón, TV, webquest)",
        "Uso de guías de trabajo y bibliografía",
      ];

      return `
      ${idx > 0 ? '<div style="page-break-before: always;"></div>' : ""}

      <div style="text-align:center; margin-bottom:16px;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td colspan="3" style="background:#1a6b3c; color:white; text-align:center; font-size:14px; font-weight:bold; padding:8px; border:1px solid #ccc;">
              Evaluación de Desempeño
            </td>
          </tr>
          <tr>
            <td style="border:1px solid #ccc; padding:6px; font-size:10px; text-align:center;">
              Área: Dirección Académica
            </td>
            <td style="border:1px solid #ccc; padding:6px; font-size:10px; text-align:center;">
              Vigencia: ${fecha}
            </td>
            <td style="border:1px solid #ccc; padding:6px; font-size:10px; text-align:center;">
              Código: FDA-24.5
            </td>
          </tr>
        </table>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
        <tr>
          <td style="width:70%; border:1px solid #ccc; padding:6px;">
            <table style="width:100%;">
              <tr>
                <td style="font-size:10px; font-weight:bold; width:120px; padding:3px 0;">NOMBRE:</td>
                <td style="font-size:10px; padding:3px 0;">${nombre}</td>
              </tr>
              <tr>
                <td style="font-size:10px; font-weight:bold; padding:3px 0;">PUESTO:</td>
                <td style="font-size:10px; padding:3px 0;">Docente · ${docente.contextCareer.code}</td>
              </tr>
              <tr>
                <td style="font-size:10px; font-weight:bold; padding:3px 0;">EVALUADOR/A:</td>
                <td style="font-size:10px; padding:3px 0;">Sistema de Evaluación Docente UPTX</td>
              </tr>
              <tr>
                <td style="font-size:10px; font-weight:bold; padding:3px 0;">PERÍODO A EVALUAR:</td>
                <td style="font-size:10px; padding:3px 0;">${periodo}</td>
              </tr>
            </table>
          </td>
          <td style="width:30%; border:1px solid #ccc; padding:6px; vertical-align:top;">
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="font-size:9px; font-weight:bold; padding:4px; border:1px solid #ccc; background:#f5f5f5;">
                  Calificación I<br>Resp.PE
                </td>
                <td rowspan="2" style="font-size:20px; font-weight:bold; text-align:center; padding:8px; border:1px solid #ccc; vertical-align:middle;">
                  ${calFinal}
                </td>
              </tr>
              <tr>
                <td style="font-size:9px; font-weight:bold; padding:4px; border:1px solid #ccc; text-align:center;">
                  ${calIF}
                </td>
              </tr>
              <tr>
                <td style="font-size:9px; font-weight:bold; padding:4px; border:1px solid #ccc; background:#f5f5f5;">
                  Calificación II<br>ESTUDIANTE
                </td>
                <td style="font-size:9px; text-align:center; padding:4px; border:1px solid #ccc;">
                  ${calIIE}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="background:#e8e8e8; border:1px solid #ccc; text-align:center; padding:5px; font-size:10px; font-weight:bold; margin-bottom:0;">
        Sección. Evaluación de la Presentación y Trabajo de Documentos · Instrumento FDA-24.5
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
        <thead>
          <tr style="background:#d0d0d0;">
            <th style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:left; width:60%;">FACTOR</th>
            <th style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:left;">DESCRIPCIÓN</th>
            <th style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center; width:8%;">CALIF.</th>
          </tr>
        </thead>
        <tbody>
          ${factoresFac.map((factor) => `
            <tr>
              <td style="border:1px solid #ccc; padding:5px; font-size:9px; font-weight:bold;">${factor}</td>
              <td style="border:1px solid #ccc; padding:5px; font-size:9px;">
                Evaluado por alumnos mediante instrumento FDA-24.5 · Sección Facilitador. Escala E/MB/B/M (1-4).
              </td>
              <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center; font-weight:bold;">${docente.facAvg}</td>
            </tr>
          `).join("")}

          ${factoresHab.map((factor) => `
            <tr>
              <td style="border:1px solid #ccc; padding:5px; font-size:9px; font-weight:bold;">${factor}</td>
              <td style="border:1px solid #ccc; padding:5px; font-size:9px;">
                Evaluado por alumnos mediante instrumento FDA-24.5 · Sección Habilidades. Escala E/MB/B/R/M (1-5).
              </td>
              <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center; font-weight:bold;">${docente.habAvg}</td>
            </tr>
          `).join("")}

          ${factoresMed.map((factor) => `
            <tr>
              <td style="border:1px solid #ccc; padding:5px; font-size:9px; font-weight:bold;">${factor}</td>
              <td style="border:1px solid #ccc; padding:5px; font-size:9px;">
                Evaluado por alumnos mediante instrumento FDA-24.5 · Sección Medios Didácticos. Escala de frecuencia (1-5).
              </td>
              <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center; font-weight:bold;">${docente.medAvg}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
        <tr>
          <td style="border:1px solid #ccc; padding:6px; font-size:9px; width:60%;">
            <strong>COMENTARIOS:</strong> Reporte generado automáticamente por el Sistema de Evaluación Docente UPTX
            con base en ${docente.totalEvals} evaluación(es) recibida(s) durante el período ${periodo}.
            Nivel de desempeño: <strong>${docente.nivel}</strong>.
          </td>
          <td style="border:1px solid #ccc; padding:6px; font-size:9px; text-align:center; width:15%;">
            <strong>Sub<br>total</strong>
          </td>
          <td style="border:1px solid #ccc; padding:6px; font-size:9px; text-align:center; width:12%;">
            ${docente.globalAvg}
          </td>
          <td style="border:1px solid #ccc; padding:6px; font-size:9px; text-align:center; width:13%;">
            ${calFinal}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="border:1px solid #ccc; padding:6px; font-size:9px; text-align:right; font-weight:bold;">
            Calificación final:
          </td>
          <td colspan="2" style="border:1px solid #ccc; padding:6px; font-size:14px; font-weight:bold; text-align:center; background:#f0f0f0;">
            ${calFinal}
          </td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
        <thead>
          <tr style="background:#d0d0d0;">
            <th style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">Sección</th>
            <th style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">Promedio obtenido</th>
            <th style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">Escala máxima</th>
            <th style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">Porcentaje</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px;">1. Evaluación del Facilitador</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center; font-weight:bold;">${docente.facAvg}</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">4.00</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">${(parseFloat(docente.facAvg) / 4 * 100).toFixed(0)}%</td>
          </tr>
          <tr>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px;">2. Habilidades del Facilitador</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center; font-weight:bold;">${docente.habAvg}</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">5.00</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">${(parseFloat(docente.habAvg) / 5 * 100).toFixed(0)}%</td>
          </tr>
          <tr>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px;">3. Medios Didácticos</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center; font-weight:bold;">${docente.medAvg}</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">5.00</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">${(parseFloat(docente.medAvg) / 5 * 100).toFixed(0)}%</td>
          </tr>
          <tr>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px;">5. Autoevaluación del Alumno</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center; font-weight:bold;">${docente.autoAvg}</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">5.00</td>
            <td style="border:1px solid #ccc; padding:5px; font-size:9px; text-align:center;">${(parseFloat(docente.autoAvg) / 5 * 100).toFixed(0)}%</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size:9px; color:#666; margin-bottom:16px;">
            <strong>Evaluaciones recibidas en este período:</strong> ${docente.totalEvals}
      </div>

      <table style="width:100%; border-collapse:collapse; margin-top:24px;">
        <tr>
          <td style="text-align:center; padding:8px; width:33%;">
            <div style="border-top:1px solid #333; padding-top:6px; font-size:9px;">
              ${nombre}<br>
              <span style="color:#666;">Nombre y Firma del Docente</span>
            </div>
          </td>
          <td style="text-align:center; padding:8px; width:33%;">
            <div style="border-top:1px solid #333; padding-top:6px; font-size:9px;">
              Coordinador de Carrera<br>
              <span style="color:#666;">Nombre y Firma</span>
            </div>
          </td>
          <td style="text-align:center; padding:8px; width:33%;">
            <div style="border-top:1px solid #333; padding-top:6px; font-size:9px;">
              Director de Area Academica<br>
              <span style="color:#666;">Nombre y Firma</span>
            </div>
          </td>
        </tr>
      </table>
      `;
    }).join("");

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
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
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #1e293b;
      padding: 20px 28px;
      background: #ffffff;
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
        padding: 12px 20px;
        background: #ffffff !important;
      }
      @page { margin: 1cm; size: letter; }
    }
  </style>
</head>
<body>
  ${paginasDocentes}
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error generando reporte PDF:", error);
    return NextResponse.json(
      { message: "Error interno generando el reporte" },
      { status: 500 },
    );
  }
}
