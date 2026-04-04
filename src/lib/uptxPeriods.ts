export type UptxPeriodTemplate = {
  nombre: string;
  inicio: string;
  fin: string;
};

export const PERIODOS_UPTX: UptxPeriodTemplate[] = [
  {
    nombre: "Cuatrimestre Septiembre-Diciembre 2025",
    inicio: "2025-09-02",
    fin: "2025-12-19",
  },
  {
    nombre: "Cuatrimestre Enero-Abril 2026",
    inicio: "2026-01-08",
    fin: "2026-04-30",
  },
  {
    nombre: "Cuatrimestre Mayo-Agosto 2026",
    inicio: "2026-05-05",
    fin: "2026-08-28",
  },
  {
    nombre: "Cuatrimestre Septiembre-Diciembre 2026",
    inicio: "2026-09-01",
    fin: "2026-12-18",
  },
  {
    nombre: "Cuatrimestre Enero-Abril 2027",
    inicio: "2027-01-11",
    fin: "2027-04-30",
  },
];
