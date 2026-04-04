# Matriz de compatibilidad

## Objetivo

Documentar la compatibilidad operativa del flujo de evaluacion estudiantil para sustentar `CA2`.

## Alcance funcional verificado

- inicio de sesion
- visualizacion de materias asignadas
- captura del formulario FDA-24.5
- envio de evaluacion
- visualizacion de mensajes de exito o error

## Base tecnica de compatibilidad

El sistema utiliza:

- HTML estandar para formularios
- Next.js y React sin dependencias de APIs exclusivas de un navegador
- diseno responsive para movil y escritorio
- validacion principal en servidor

## Plataformas objetivo

| Plataforma | Navegador | Estado esperado |
| --- | --- | --- |
| Windows 10/11 | Chrome | Compatible |
| Windows 10/11 | Edge | Compatible |
| Windows 10/11 | Firefox | Compatible |
| Android | Chrome | Compatible |
| iOS | Safari | Compatible |

## Evidencia funcional

- dashboard responsive de alumno en `src/app/alumno/page.tsx`
- formulario responsive en `src/app/alumno/evaluar/[subjectId]/page.tsx`
- validacion de captura en servidor en `src/app/admin/evaluaciones/actions.ts`

## Criterio de aceptacion

Se considera cumplido `CA2` cuando el alumno puede completar el flujo de evaluacion desde cualquiera de las plataformas objetivo con acceso a internet, sin errores de captura ni de envio.
