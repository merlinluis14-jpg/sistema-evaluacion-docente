const ACADEMIC_WORD_REPLACEMENTS: Record<string, string> = {
  ingenieria: "ingeniería",
  robotica: "robótica",
  electronica: "electrónica",
  logistica: "logística",
  administracion: "administración",
  gestion: "gestión",
  programacion: "programación",
  matematicas: "matemáticas",
  analisis: "análisis",
  diseno: "diseño",
  calculo: "cálculo",
  fisica: "física",
  quimica: "química",
  estadistica: "estadística",
  economia: "economía",
  mecanica: "mecánica",
  bibliografia: "bibliografía",
  asesoria: "asesoría",
  asesorias: "asesorías",
  tutoria: "tutoría",
  tutorias: "tutorías",
  investigacion: "investigación",
  pizarron: "pizarrón",
  conduccion: "conducción",
  atencion: "atención",
  relacion: "relación",
  teoria: "teoría",
  practica: "práctica",
};

function applyWordCase(source: string, replacement: string) {
  if (source === source.toUpperCase()) {
    return replacement.toUpperCase();
  }

  if (source[0] === source[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  return replacement;
}

export function formatAcademicText(value: string | null | undefined) {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[A-Za-z]+/g, (word) => {
      const replacement = ACADEMIC_WORD_REPLACEMENTS[word.toLowerCase()];
      return replacement ? applyWordCase(word, replacement) : word;
    });
}
