# Sistema Web de Evaluacion Docente - UPTX

## Proyecto de tesina

Sistema web para automatizar la evaluacion del desempeno docente en la Universidad Politecnica de Texcoco mediante el instrumento FDA-24.5. El proyecto contempla captura de evaluaciones por alumnos, seguimiento administrativo, evaluacion de coordinacion, reportes institucionales y exportacion de evidencias.

## Alcance funcional

- Autenticacion por roles: `ADMIN`, `DOCENTE` y `ALUMNO`
- Gestion de carreras, docentes, alumnos, grupos, materias y periodos
- Importacion masiva por CSV para docentes, materias, alumnos y evaluacion de coordinacion
- Evaluacion estudiantil con validaciones en servidor y una sola captura por materia y periodo
- Reportes por docente, materia, grupo y carrera
- Exportacion de `PDF alumnos`, `PDF institucional` y `Excel`
- Bitacora administrativa (`AdminLog`) y bitacora de importaciones (`ImportLog`)
- Administracion de cuentas admin con reautenticacion
- Politica de privacidad y resguardo de anonimato

## Stack tecnologico

- Next.js 16 (App Router, Server Actions)
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
- Prisma CLI disponible via dependencias del proyecto
- `pg_dump` y `pg_restore` si se van a usar respaldos y restauraciones

## Configuracion del entorno

1. Instalar dependencias:

```bash
npm install
```

2. Crear el archivo `.env` a partir de `.env.example`.

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

Referencia en [./.env.example](./.env.example):

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## Comandos utiles

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

## Respaldo y recuperacion

El proyecto incluye scripts para respaldo y restauracion:

- Windows:
  - [./scripts/backup.bat](./scripts/backup.bat)
  - [./scripts/restore.bat](./scripts/restore.bat)
- Linux/macOS:
  - [./scripts/backup.sh](./scripts/backup.sh)
  - [./scripts/restore.sh](./scripts/restore.sh)

Guia completa en [./docs/respaldos-y-recuperacion.md](./docs/respaldos-y-recuperacion.md).

## Documentacion para entrega

- [./docs/matriz-cumplimiento.md](./docs/matriz-cumplimiento.md)
- [./docs/operacion-admin.md](./docs/operacion-admin.md)
- [./docs/respaldos-y-recuperacion.md](./docs/respaldos-y-recuperacion.md)
- [./docs/plan-pruebas.md](./docs/plan-pruebas.md)

## Calidad y validacion

El proyecto se valida con:

- TypeScript estricto (`npx tsc --noEmit`)
- tipado validado con `npm run typecheck`
- ESLint
- pruebas con Jest
- validaciones de acceso por roles
- validaciones de negocio en servidor
- indices y consultas optimizadas en Prisma/PostgreSQL

## Nota para evaluacion de tesina

El sistema esta preparado para operar a nivel universidad. Durante la etapa actual de validacion se puede cargar informacion real o de prueba por carrera sin cambiar la arquitectura principal.
