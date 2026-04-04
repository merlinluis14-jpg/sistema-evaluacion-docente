# Guia de operacion para administracion

## Objetivo

Este documento resume el flujo recomendado para operar el sistema con orden y evitar errores durante las pruebas o la operacion institucional.

## Flujo recomendado

1. Verificar que exista un periodo activo.
2. Confirmar que al menos una cuenta admin adicional este habilitada.
3. Importar datos base en este orden:
   - docentes
   - materias
   - alumnos
4. Revisar grupos y materias enlazadas.
5. Realizar una evaluacion de prueba con un alumno.
6. Validar resultados en reportes.
7. Capturar o importar evaluacion de coordinacion.
8. Exportar `PDF alumnos`, `PDF institucional` y `Excel`.
9. Ejecutar respaldo al cierre del periodo o de la jornada.

## Importaciones recomendadas

Cada catalogo tiene dos vias de mantenimiento:

- edicion manual para corregir un registro puntual sin afectar el resto
- importacion CSV para altas o actualizaciones masivas

### Docentes

- Verificar `numero_empleado`, correo institucional y tipo de docente (`PA` o `PTC`).
- Evitar duplicados de correo o numero de empleado.
- Si un docente cambia de correo, carrera o estatus, usar la opcion `Editar` en la lista de docentes.
- Si se desea reemplazar el catalogo completo de una o varias carreras, activar `Sincronizar catalogo importado` durante la importacion. Los docentes faltantes se desactivan, no se elimina su historial.

### Materias

- Confirmar codigo, nombre, cuatrimestre y docente asignado.
- El cuatrimestre debe coincidir con los grupos que despues se van a usar.
- Para un cambio aislado de nombre, docente o cuatrimestre, usar la edicion manual de materias.
- Si el archivo CSV representa la version oficial del catalogo, activar `Sincronizar catalogo importado`. Las materias faltantes se desactivan y se resincronizan sus grupos compatibles.

### Alumnos

- Verificar matricula, carrera y grupo.
- La importacion crea o reutiliza grupos y enlaza materias compatibles automaticamente.
- Si un alumno cambia de matricula, correo, carrera, grupo o estatus, usar la opcion `Editar` en la lista de alumnos.
- Si se necesita reemplazar el roster del periodo activo, activar `Sincronizar roster del periodo activo`. El sistema actualiza los grupos del periodo importado sin borrar historial de periodos anteriores.

### Evaluacion de coordinacion

- Usar la plantilla generada por el sistema.
- Capturar solo las columnas solicitadas.
- Para `PA`, los factores no aplicables deben permanecer como `N/A`.

## Uso de reportes

La vista de reportes permite:

- filtrar por periodo, carrera, materia y grupo
- ordenar por calificacion de referencia
- revisar resumen por materia
- revisar resumen por grupo
- revisar resumen por carrera
- revisar el detalle individual de cada docente

## Control de administradores

Desde `Administradores` se puede:

- crear otra cuenta admin
- restablecer contrasena de otra cuenta admin
- desactivar una cuenta admin

Todas estas acciones requieren reautenticacion del administrador activo y quedan registradas en logs.

## Recomendaciones de cierre

- Revisar la bitacora administrativa
- Confirmar que los reportes del periodo sean consistentes
- Guardar respaldo de la base de datos
- Resguardar los PDFs institucionales del periodo
