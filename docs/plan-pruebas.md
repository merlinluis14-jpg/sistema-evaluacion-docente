# Plan de pruebas del sistema

## Objetivo

Validar el flujo principal de operacion antes de la entrega final y durante pruebas con usuarios.

## Validaciones tecnicas

Ejecutar:

```bash
npm run lint
npm run typecheck
npm run test
npm run benchmark:ca1
```

## Escenarios funcionales

### 1. Autenticacion por roles

- Iniciar sesion como admin
- Intentar un acceso fallido como admin para validar el registro de `LOGIN_FAILED`
- Iniciar sesion como docente
- Iniciar sesion como alumno
- Confirmar que cada rol solo accede a su area
- Confirmar en `AdminLog` que el acceso admin exitoso quede registrado como `LOGIN`

### 2. Importacion base

- Importar docentes
- Importar materias
- Importar alumnos
- Confirmar que existan grupos y materias enlazadas

### 3. Evaluacion de alumnos

- Entrar con una cuenta de alumno valida
- Capturar una evaluacion
- Confirmar que el sistema no permita duplicarla en el mismo periodo y materia
- Confirmar que el alumno no pueda evaluar materias fuera de su grupo

### 4. Reportes

- Revisar resultados por docente
- Revisar resumen por materia
- Revisar resumen por grupo
- Revisar resumen por carrera
- Filtrar por banda de calificacion

### 5. Exportaciones

- Generar `PDF alumnos`
- Generar `PDF institucional`
- Exportar `Excel`
- Validar que el PDF institucional coincida con el formato esperado

### 6. Coordinacion

- Capturar evaluacion de coordinacion manual
- Importar evaluacion de coordinacion por CSV usando la plantilla oficial
- Confirmar que el promedio institucional se actualice

### 7. Administracion

- Crear una cuenta admin con reautenticacion
- Restablecer la contrasena de otro admin
- Desactivar un admin secundario
- Revisar los logs generados

### 8. Respaldo y recuperacion

- Ejecutar `scripts/backup.bat` y confirmar la generacion del archivo en `backups/`
- Registrar la tarea diaria con `scripts/register-daily-backup-task.ps1`
- Verificar que la tarea `UPTX-Evaluacion-Docente-Backup` quede activa
- Confirmar que `backups/daily-backup.log` registre la ejecucion programada
- Restaurar un respaldo de prueba en entorno controlado con `scripts/restore.bat`

### 9. Rendimiento y concurrencia

- Ejecutar `npm run benchmark:ca1`
- Confirmar que el JSON final reporte `createdCount >= 1000`
- Confirmar que el JSON final reporte `averageLatencyMs < 2000`
- Guardar la salida como evidencia para `CA1` y `RNF4`

### 10. Compatibilidad y formato institucional

- Revisar la matriz en `docs/matriz-compatibilidad.md`
- Validar el flujo de evaluacion en al menos una plataforma movil y una de escritorio
- Generar el `PDF institucional` y contrastarlo con `docs/validacion-reportes.md`
- Confirmar que el formato conserve encabezado, tabla de factores, subtotal, calificacion y firma

## Resultado esperado

Si todos los escenarios anteriores son correctos, el sistema queda validado para presentacion de tesina y piloto institucional controlado.
