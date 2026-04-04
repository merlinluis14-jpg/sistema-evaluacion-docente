# Prueba de carga CA1 y RNF4

## Objetivo

Validar que el sistema pueda registrar al menos **1000 evaluaciones concurrentes** y que el tiempo promedio de respuesta de la operacion principal de captura permanezca por debajo de **2 segundos**.

## Script incluido

```bash
npm run benchmark:ca1
```

## Que hace la prueba

- crea una carrera sintetica temporal
- crea un docente, una materia, un grupo y un periodo de prueba
- genera `1000` alumnos sinteticos con sus usuarios
- registra `1000` evaluaciones concurrentes contra el modelo real `Evaluation`
- mide latencia minima, maxima, promedio, percentil 95 y throughput
- elimina toda la data sintetica al finalizar

## Criterios de aceptacion

- `createdCount >= 1000`
- `averageLatencyMs < 2000`

## Resultado esperado

El script devuelve un JSON con:

- `createdCount`
- `totalTimeMs`
- `averageLatencyMs`
- `p95LatencyMs`
- `throughputPerSecond`
- `meetsCa1`
- `meetsRnf4`

## Ejecucion validada

Resultado medido el **3 de abril de 2026** sobre la base configurada en el proyecto:

```json
{
  "students": 1000,
  "createdCount": 1000,
  "totalTimeMs": 2735.48,
  "averageLatencyMs": 1846.56,
  "minLatencyMs": 337.76,
  "maxLatencyMs": 2672.5,
  "p95LatencyMs": 2590.54,
  "throughputPerSecond": 365.57,
  "meetsCa1": true,
  "meetsRnf4": true
}
```

Interpretacion:

- `CA1` se cumple porque se registraron `1000` evaluaciones concurrentes.
- `RNF4` se cumple porque la latencia promedio fue de `1846.56 ms`, por debajo del umbral de `2000 ms`.

## Nota operativa

Ejecutar preferentemente contra un entorno de pruebas o en una ventana controlada, ya que la prueba genera carga concurrente real sobre la base de datos configurada en `DATABASE_URL`.
