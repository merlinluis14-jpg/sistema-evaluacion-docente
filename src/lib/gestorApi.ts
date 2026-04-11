type QueryValue = string | number | boolean | null | undefined;

export type CarreraExterna = {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string | null;
  facultad?: string | null;
  activa?: boolean;
  fecha_creacion?: string;
};

export type CarreraResumenExterna = Pick<CarreraExterna, "id" | "nombre" | "codigo">;

export type MateriaExterna = {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string | null;
  cuatrimestre: number;
  creditos?: number | null;
  horas_semanales?: number | null;
  activa: boolean;
  carrera: CarreraResumenExterna;
};

export type ProfesorBaseExterno = {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  email: string;
  tipo_profesor: string;
  activo: boolean;
};

export type RelacionAcademicaExterna = {
  profesor: ProfesorBaseExterno;
  materia: MateriaExterna;
  carrera: CarreraResumenExterna;
};

export type GrupoExterno = {
  id: number;
  codigo: string;
  numero_grupo: number;
  turno: string;
  cuatrimestre: number;
  activo: boolean;
  carrera: CarreraResumenExterna;
};

export type MateriaGrupoExterna = {
  materia: Pick<
    MateriaExterna,
    "id" | "codigo" | "nombre" | "cuatrimestre" | "activa"
  >;
  profesor: ProfesorBaseExterno | null;
};

export type AsignacionGrupoExterna = {
  grupo: GrupoExterno;
  carrera: CarreraResumenExterna;
  materia: Pick<
    MateriaExterna,
    | "id"
    | "codigo"
    | "nombre"
    | "cuatrimestre"
    | "activa"
    | "creditos"
    | "horas_semanales"
  >;
  profesor: ProfesorBaseExterno | null;
};

export type ProfesorExterno = ProfesorBaseExterno & {
  carreras: CarreraResumenExterna[];
  materias: MateriaExterna[];
  grupos: GrupoExterno[];
  total_carreras: number;
  total_materias: number;
  total_grupos: number;
};

export type RespuestaCarrerasExternas = {
  total: number;
  carreras: CarreraExterna[];
};

export type RespuestaRelacionesAcademicas = {
  total: number;
  relaciones: RelacionAcademicaExterna[];
};

export type RespuestaGruposExternos = {
  total: number;
  grupos: GrupoExterno[];
};

export type RespuestaAsignacionesGrupoExternas = {
  total: number;
  asignaciones: AsignacionGrupoExterna[];
};

export type ResumenCatalogoAcademico = {
  carreras: number;
  grupos: number;
  materias: number;
  relaciones: number;
};

export type RespuestaProfesores = {
  total: number;
  profesores: ProfesorExterno[];
  resumen: ResumenCatalogoAcademico;
  warnings: string[];
};

export type CatalogoAcademicoExterno = RespuestaProfesores & {
  carreras: CarreraExterna[];
  grupos: GrupoExterno[];
  asignaciones: AsignacionGrupoExterna[];
};

const DEFAULT_BASE_URL = "https://horarios.ddns.net/api/ext";
const API_KEY = process.env.GESTOR_API_KEY || "";

function getGestorApiBaseUrl() {
  const rawValue = (process.env.GESTOR_API_URL || DEFAULT_BASE_URL)
    .trim()
    .replace(/\/+$/, "");

  if (/\/api\/ext$/i.test(rawValue)) {
    return rawValue;
  }

  if (/\/api$/i.test(rawValue)) {
    return `${rawValue}/ext`;
  }

  return `${rawValue}/api/ext`;
}

function buildGestorUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(path.replace(/^\/+/, ""), `${getGestorApiBaseUrl()}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function fetchGestorApi<T>(
  path: string,
  options: {
    query?: Record<string, QueryValue>;
    requiresApiKey?: boolean;
  } = {},
): Promise<T> {
  const { query, requiresApiKey = true } = options;

  if (requiresApiKey && !API_KEY) {
    throw new Error("Missing GESTOR_API_KEY");
  }

  const res = await fetch(buildGestorUrl(path, query).toString(), {
    cache: "no-store",
    headers: requiresApiKey
      ? {
          "X-API-Key": API_KEY,
        }
      : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      ("error" in payload || "message" in payload)
        ? String((payload as { error?: string; message?: string }).error || (payload as { error?: string; message?: string }).message)
        : `Gestor API returned ${res.status}: ${res.statusText}`;

    throw new Error(message);
  }

  return payload as T;
}

function sortCarreras(carreras: CarreraResumenExterna[]) {
  return [...carreras].sort((left, right) =>
    left.codigo.localeCompare(right.codigo, "es"),
  );
}

function sortMaterias(materias: MateriaExterna[]) {
  return [...materias].sort((left, right) => {
    if (left.cuatrimestre !== right.cuatrimestre) {
      return left.cuatrimestre - right.cuatrimestre;
    }

    return left.codigo.localeCompare(right.codigo, "es");
  });
}

function buildTeacherPreview(
  asignaciones: AsignacionGrupoExterna[],
): ProfesorExterno[] {
  const teacherMap = new Map<
    number,
    {
      teacher: ProfesorExterno;
      careerKeys: Set<string>;
      subjectKeys: Set<string>;
      groupKeys: Set<string>;
    }
  >();

  for (const asignacion of asignaciones) {
    if (!asignacion.profesor) {
      continue;
    }

    const materia: MateriaExterna = {
      ...asignacion.materia,
      carrera: asignacion.carrera,
    };
    const current = teacherMap.get(asignacion.profesor.id);

    if (!current) {
      teacherMap.set(asignacion.profesor.id, {
        teacher: {
          ...asignacion.profesor,
          carreras: [asignacion.carrera],
          materias: [materia],
          grupos: [asignacion.grupo],
          total_carreras: 1,
          total_materias: 1,
          total_grupos: 1,
        },
        careerKeys: new Set([String(asignacion.carrera.id)]),
        subjectKeys: new Set([
          `${asignacion.carrera.codigo.toUpperCase()}:${asignacion.materia.codigo.toUpperCase()}`,
        ]),
        groupKeys: new Set([String(asignacion.grupo.id)]),
      });
      continue;
    }

    if (!current.careerKeys.has(String(asignacion.carrera.id))) {
      current.teacher.carreras.push(asignacion.carrera);
      current.careerKeys.add(String(asignacion.carrera.id));
    }

    const subjectKey = `${asignacion.carrera.codigo.toUpperCase()}:${asignacion.materia.codigo.toUpperCase()}`;
    if (!current.subjectKeys.has(subjectKey)) {
      current.teacher.materias.push(materia);
      current.subjectKeys.add(subjectKey);
    }

    const groupKey = String(asignacion.grupo.id);
    if (!current.groupKeys.has(groupKey)) {
      current.teacher.grupos.push(asignacion.grupo);
      current.groupKeys.add(groupKey);
    }
  }

  return [...teacherMap.values()]
    .map(({ teacher }) => ({
      ...teacher,
      carreras: sortCarreras(teacher.carreras),
      materias: sortMaterias(teacher.materias),
      total_carreras: teacher.carreras.length,
      total_materias: teacher.materias.length,
      total_grupos: teacher.grupos.length,
    }))
    .sort((left, right) =>
      left.nombre_completo.localeCompare(right.nombre_completo, "es"),
    );
}

export async function pingGestorApi(): Promise<boolean> {
  try {
    const data = await fetchGestorApi<{ status?: string }>("/ping", {
      requiresApiKey: false,
    });
    return data.status === "ok";
  } catch (error) {
    console.error("Error pinging Gestor API:", error);
    return false;
  }
}

export async function getCarrerasExternas({
  activa,
}: {
  activa?: boolean;
} = {}): Promise<RespuestaCarrerasExternas> {
  return fetchGestorApi<RespuestaCarrerasExternas>("/carreras", {
    query: { activa },
  });
}

export async function getRelacionesAcademicasExternas({
  carreraId,
  cuatrimestre,
  profesorId,
  activo = true,
}: {
  carreraId?: number;
  cuatrimestre?: number;
  profesorId?: number;
  activo?: boolean;
} = {}): Promise<RespuestaRelacionesAcademicas> {
  return fetchGestorApi<RespuestaRelacionesAcademicas>("/relaciones", {
    query: {
      carrera_id: carreraId,
      cuatrimestre,
      profesor_id: profesorId,
      activo,
    },
  });
}

export async function getGruposExternos({
  activo,
  carreraId,
  cuatrimestre,
  turno,
}: {
  activo?: boolean;
  carreraId?: number;
  cuatrimestre?: number;
  turno?: string;
} = {}): Promise<RespuestaGruposExternos> {
  return fetchGestorApi<RespuestaGruposExternos>("/grupos", {
    query: {
      activo,
      carrera_id: carreraId,
      cuatrimestre,
      turno,
    },
  });
}

export async function getAsignacionesGrupoExternas({
  activo,
  carreraId,
  grupoId,
  cuatrimestre,
  profesorId,
}: {
  activo?: boolean;
  carreraId?: number;
  grupoId?: number;
  cuatrimestre?: number;
  profesorId?: number;
} = {}): Promise<RespuestaAsignacionesGrupoExternas> {
  return fetchGestorApi<RespuestaAsignacionesGrupoExternas>(
    "/asignaciones-grupo",
    {
      query: {
        activo,
        carrera_id: carreraId,
        grupo_id: grupoId,
        cuatrimestre,
        profesor_id: profesorId,
      },
    },
  );
}

export async function getCatalogoAcademicoExterno({
  activo = true,
}: {
  activo?: boolean;
} = {}): Promise<CatalogoAcademicoExterno> {
  const [careersData, groupsData, assignmentsData] = await Promise.all([
    getCarrerasExternas(),
    getGruposExternos({ activo }),
    getAsignacionesGrupoExternas({ activo }),
  ]);

  const profesores = buildTeacherPreview(assignmentsData.asignaciones);
  const subjectKeys = new Set(
    assignmentsData.asignaciones.map(
      (asignacion) =>
        `${asignacion.carrera.codigo.toUpperCase()}:${asignacion.materia.codigo.toUpperCase()}`,
    ),
  );

  return {
    total: profesores.length,
    profesores,
    carreras: careersData.carreras,
    grupos: groupsData.grupos,
    asignaciones: assignmentsData.asignaciones,
    resumen: {
      carreras: careersData.carreras.length,
      grupos: groupsData.grupos.length,
      materias: subjectKeys.size,
      relaciones: assignmentsData.asignaciones.length,
    },
    warnings: [
      "La vista previa muestra docentes con al menos una asignacion activa grupo-materia-docente en el Gestor de Horarios.",
      "La sincronizacion academica consume grupos y asignaciones por grupo del sistema externo. Para reflejarlos localmente, ejecuta la sincronizacion con un periodo de evaluacion activo.",
    ],
  };
}

export async function getProfesoresExternos({
  activo = true,
}: {
  activo?: boolean;
} = {}): Promise<RespuestaProfesores> {
  const data = await getCatalogoAcademicoExterno({ activo });

  return {
    total: data.total,
    profesores: data.profesores,
    resumen: data.resumen,
    warnings: data.warnings,
  };
}
