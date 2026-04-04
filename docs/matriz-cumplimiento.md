# Matriz de cumplimiento del proyecto

## Objetivo

Este documento resume como el sistema cumple los requerimientos funcionales, de seguridad, operacion y calidad solicitados para la tesina del Sistema Web de Evaluacion Docente.

## Requerimientos funcionales

| Requisito | Implementacion actual | Evidencia principal |
| --- | --- | --- |
| Acceso por roles | El sistema distingue cuentas `ADMIN`, `DOCENTE` y `ALUMNO`, con autenticacion por credenciales y control de rutas. | `src/lib/auth.ts`, `src/middleware.ts` |
| Gestion academica | El administrador puede gestionar carreras, docentes, alumnos, grupos, materias y periodos, tanto manualmente como por importacion donde aplica. | `src/app/admin/*`, `src/app/admin/grupos/nuevo/page.tsx` |
| Importacion masiva | Se soporta importacion por CSV para docentes, materias, alumnos y evaluacion de coordinacion. | `src/lib/csv/*`, `src/app/api/import/*` |
| Evaluacion de alumnos | El alumno captura el instrumento FDA-24.5 en linea y la validacion final ocurre en servidor. | `src/app/alumno/page.tsx`, `src/app/admin/evaluaciones/actions.ts` |
| Una sola evaluacion por materia y periodo | Existe restriccion unica por `studentId + subjectId + periodId` y validacion previa en servidor. | `prisma/schema.prisma`, `src/app/admin/evaluaciones/actions.ts` |
| Anonimato | Los reportes docentes no exponen identidad del alumno y el modelo marca la evaluacion como anonima. | `prisma/schema.prisma`, `src/app/docente/*`, `src/lib/reportes.ts` |
| Reportes por docente | Se muestran resultados, promedios y detalle por docente. | `src/app/admin/reportes/page.tsx`, `src/app/admin/reportes/[teacherId]/page.tsx` |
| Reportes por materia, grupo y carrera | Se agregaron concentrados por materia, grupo y carrera para seguimiento institucional. | `src/app/admin/reportes/page.tsx` |
| Exportacion de resultados | Se generan `PDF alumnos`, `PDF institucional` y `Excel` desde la vista de reportes. | `src/app/admin/reportes/ExportButtons.tsx`, `docs/validacion-reportes.md` |
| Evaluacion de coordinacion | La jefatura/coordinacion puede capturar su evaluacion por docente, carrera y periodo. | `src/app/admin/reportes/[teacherId]/CareerHeadEvaluationForm.tsx`, `src/app/admin/reportes/actions.ts` |
| Importacion de evaluacion de coordinacion | Existe plantilla estandar y carga masiva por CSV para evitar captura manual repetitiva. | `src/app/admin/reportes/importar-jefatura/page.tsx`, `src/app/api/admin/reportes/template-jefatura/route.ts` |
| Bitacora administrativa | Las acciones relevantes y los accesos administrativos exitosos o fallidos quedan registrados en `AdminLog`. | `src/lib/adminLog.ts`, `src/lib/auth.ts`, `src/app/admin/logs/page.tsx` |
| Control de administradores | El sistema permite crear, restablecer y desactivar cuentas admin con reautenticacion. | `src/app/admin/administradores/*` |

## Seguridad y proteccion de datos

| Requisito | Implementacion actual | Evidencia principal |
| --- | --- | --- |
| Proteccion de credenciales y cifrado | Las contrasenas se almacenan con hash bcrypt y el despliegue institucional se sustenta sobre infraestructura con cifrado en reposo y en transito. | `src/lib/auth.ts`, `src/lib/prisma.ts`, `docs/seguridad-y-continuidad.md` |
| Control de acceso | El middleware restringe rutas por rol y bloquea accesos indebidos. | `src/middleware.ts` |
| Reautenticacion para acciones sensibles | Crear admins, restablecer contrasenas y desactivar admins requiere contrasena actual del administrador. | `src/app/admin/administradores/actions.ts` |
| Validacion en servidor | La evaluacion del alumno no confia en datos del cliente y valida grupo, periodo, materia y docente. | `src/app/admin/evaluaciones/actions.ts` |
| Aviso de privacidad | Existe un apartado publico de privacidad y resguardo de anonimato. | `src/app/privacidad/page.tsx` |

## Operacion y continuidad

| Requisito | Implementacion actual | Evidencia principal |
| --- | --- | --- |
| Respaldo diario | El despliegue institucional contempla respaldos diarios administrados por la plataforma y scripts complementarios del proyecto para respaldo y restauracion. | `docs/seguridad-y-continuidad.md`, `scripts/backup.bat`, `scripts/daily-backup-task.bat`, `scripts/register-daily-backup-task.ps1`, `scripts/backup.sh` |
| Recuperacion | Se incluyen scripts de restauracion y guia de uso. | `scripts/restore.bat`, `scripts/restore.sh`, `docs/respaldos-y-recuperacion.md` |
| Flujo operativo | El dashboard incluye recomendaciones y el proyecto cuenta con manual de operacion administrativa. | `src/app/admin/page.tsx`, `docs/operacion-admin.md` |

## Calidad tecnica

| Requisito | Implementacion actual | Evidencia principal |
| --- | --- | --- |
| Tipado estricto | El proyecto compila con `npx tsc --noEmit`. | `tsconfig.json` |
| Calidad de codigo | El proyecto se valida con ESLint. | `package.json`, configuracion de ESLint |
| Pruebas automatizadas | Existen pruebas sobre middleware, importacion CSV, reportes y evaluacion. | `__tests__/*` |
| Rendimiento de consultas y concurrencia | El esquema Prisma incluye indices para reportes, docentes, materias y evaluaciones, y el proyecto incorpora una prueba de carga reproducible para `CA1` y `RNF4`. | `prisma/schema.prisma`, `scripts/benchmark-ca1.cjs`, `docs/prueba-carga-ca1.md` |

## Conclusion

El sistema cubre el flujo principal solicitado para operacion institucional: carga de catalogos, captura de evaluaciones, seguimiento por docente/grupo/carrera, evaluacion de coordinacion, exportacion de evidencias y control administrativo.
