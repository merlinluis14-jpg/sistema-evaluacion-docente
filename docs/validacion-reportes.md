# Validacion del formato de reportes

## Objetivo

Sustentar `CA3` demostrando que el reporte institucional exportado por el sistema respeta la estructura del formato `FDA-24.5`.

## Elementos replicados en el PDF institucional

- encabezado `Evaluacion de Desempeno`
- area `Direccion Academica`
- vigencia o periodo evaluado
- codigo `FDA-24.5`
- bloque de identidad del docente
- bloque de evaluador o elaborador
- calificacion de responsable PE
- calificacion de estudiante
- calificacion final
- tabla de factores y definiciones
- seccion de comentarios
- bloque de subtotal y calificacion
- datos de elaboracion y firma

## Evidencia tecnica

- generacion del formato institucional en `src/app/admin/reportes/ExportButtons.tsx`
- version HTML imprimible del formato en `src/app/api/reportes/pdf-institucional/route.ts`
- calculo institucional y filas de factores en `src/lib/reportes.ts`

## Criterio de aceptacion

Se considera cumplido `CA3` cuando el PDF institucional generado por el sistema conserva la estructura visual y los campos requeridos por el formato FDA-24.5 usado por la institucion.
