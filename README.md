# Sistema Web de Evaluación Docente - UPTX

## Proyecto de tesina

Sistema web para automatizar la evaluación del desempeño docente en la Universidad Politécnica de Texcoco mediante el instrumento FDA-24.5. El proyecto integra la información académica proveniente del sistema de Horarios y concentra en una sola plataforma la carga de alumnos, la captura de evaluaciones, la revisión administrativa y la generación de reportes institucionales.

## Modelo operativo actual

La operación del sistema se basa en una integración unidireccional:

`Gestor de Horarios -> Evaluación Docente`

### Fuente de verdad por sistema

#### Gestor de Horarios

- carreras
- docentes
- materias
- grupos
- asignaciones reales `grupo + materia + docente`

#### Evaluación Docente

- alumnos
- períodos de evaluación
- respuestas de alumnos
- observaciones de jefatura o coordinación
- resultados y reportes
- bitácoras administrativas

## Flujo recomendado de operación

1. Verificar que exista un período activo.
2. Sincronizar academia desde Horarios.
3. Confirmar que carreras, docentes, materias y grupos se reflejaron correctamente.
4. Importar alumnos por CSV en el período activo.
5. Habilitar o validar la evaluación estudiantil.
6. Revisar reportes, exportar evidencias y resguardar respaldos.

## Alcance funcional

- Autenticación por roles: `ADMIN`, `DOCENTE` y `ALUMNO`
- Sincronización académica desde Horarios para carreras, docentes, materias, grupos y asignaciones por grupo
- Importación masiva por CSV para alumnos
- Gestión de contraseñas temporales para alumnos con restablecimiento por administración
- Evaluación estudiantil con validaciones en servidor y una sola captura por asignación y período
- Evaluación de jefatura o coordinación con observaciones
- Reportes por docente, materia, grupo y carrera
- Exportación de `PDF alumnos`, `PDF institucional` y `Excel`
- Bitácora administrativa (`AdminLog`) con acciones y accesos de administradores
- Bitácora de importaciones (`ImportLog`)
- Administración de cuentas admin con reautenticación
- Política de privacidad y resguardo de anonimato
- Evidencia técnica para carga concurrente, compatibilidad y continuidad operativa

## Stack tecnológico

- Next.js 16 (App Router, Route Handlers, Server Actions)
- React 19
- PostgreSQL
- Prisma ORM
- NextAuth
- Tailwind CSS
- jsPDF / jspdf-autotable
- Jest + Testing Library

## Requisitos previos

- Node.js 20 o superior
- npm 10 o superior
- PostgreSQL
- Prisma CLI disponible vía dependencias del proyecto
- acceso a la API del sistema de Horarios
- `pg_dump` y `pg_restore` si se van a usar respaldos y restauraciones

## Configuración del entorno

1. Instalar dependencias:

```bash
npm install
```

2. Crear el archivo `.env` a partir de [`.env.example`](./.env.example).

3. Configurar la base de datos:

```bash
npx prisma db push
npx prisma db seed
```

4. Iniciar el proyecto:

```bash
npm run dev
```

## Variables de entorno

Referencia en [`.env.example`](./.env.example):

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GESTOR_API_URL`
- `GESTOR_API_KEY`

### Integración con Horarios

- `GESTOR_API_URL` debe apuntar a la API académica del sistema de Horarios.
- `GESTOR_API_KEY` se usa para autenticar la sincronización académica.
- En producción, las mismas variables deben existir en Vercel.

## Comandos útiles

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

## Despliegue

El proyecto está preparado para ejecutarse en entornos como Vercel con PostgreSQL administrado externamente. Para un despliegue correcto se recomienda:

1. definir las variables de entorno del proyecto;
2. verificar conectividad con la base de datos;
3. verificar conectividad con Horarios;
4. confirmar que exista al menos un período activo;
5. ejecutar una sincronización académica de validación antes de importar alumnos oficiales.

## Respaldo y recuperación

El proyecto incluye scripts para respaldo y restauración:

- Windows:
  - [./scripts/backup.bat](./scripts/backup.bat)
  - [./scripts/daily-backup-task.bat](./scripts/daily-backup-task.bat)
  - [./scripts/register-daily-backup-task.ps1](./scripts/register-daily-backup-task.ps1)
  - [./scripts/unregister-daily-backup-task.ps1](./scripts/unregister-daily-backup-task.ps1)
  - [./scripts/restore.bat](./scripts/restore.bat)
- Linux/macOS:
  - [./scripts/backup.sh](./scripts/backup.sh)
  - [./scripts/restore.sh](./scripts/restore.sh)

Guía completa en [./docs/respaldos-y-recuperacion.md](./docs/respaldos-y-recuperacion.md).

## Documentación para entrega

- [./docs/matriz-cumplimiento.md](./docs/matriz-cumplimiento.md)
- [./docs/seguridad-y-continuidad.md](./docs/seguridad-y-continuidad.md)
- [./docs/operacion-admin.md](./docs/operacion-admin.md)
- [./docs/respaldos-y-recuperacion.md](./docs/respaldos-y-recuperacion.md)
- [./docs/plan-pruebas.md](./docs/plan-pruebas.md)
- [./docs/prueba-carga-ca1.md](./docs/prueba-carga-ca1.md)
- [./docs/matriz-compatibilidad.md](./docs/matriz-compatibilidad.md)
- [./docs/validacion-reportes.md](./docs/validacion-reportes.md)

## Calidad y validación

El proyecto se valida con:

- tipado estricto de TypeScript
- `npm run typecheck`
- ESLint
- pruebas con Jest
- validaciones de acceso por roles
- validaciones de negocio en servidor
- sincronización idempotente de catálogos académicos
- consultas optimizadas en Prisma/PostgreSQL

## Nota para presentación y operación

El sistema ya no depende de captura manual duplicada para docentes, materias, carreras o grupos. El catálogo académico se sincroniza desde Horarios y la carga administrativa local se concentra en alumnos, períodos, evaluación y reportes. Esto permite presentar el proyecto con un flujo institucional real y operar bajo un esquema controlado de piloto o despliegue formal.
