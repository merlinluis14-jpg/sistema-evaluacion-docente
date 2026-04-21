# Guía de operación para administración

## Objetivo

Este documento resume el flujo recomendado para operar el sistema con orden y evitar errores durante pruebas, pilotos o uso institucional.

## Principio de operación

La información académica base ya no se captura manualmente en este sistema. El catálogo oficial proviene de Horarios y se sincroniza en Evaluación Docente.

### Fuente de verdad

#### Horarios

- carreras
- docentes
- materias
- grupos
- asignaciones `grupo + materia + docente`

#### Evaluación Docente

- alumnos
- períodos de evaluación
- respuestas de evaluación
- observaciones de jefatura o coordinación
- resultados y reportes
- bitácoras administrativas

## Flujo recomendado

1. Verificar que exista un período activo.
2. Confirmar que la conexión con Horarios esté disponible.
3. Ejecutar `Sincronizar academia`.
4. Revisar carreras, docentes, materias y grupos sincronizados.
5. Importar alumnos del período activo.
6. Validar con un alumno de prueba que vea sus evaluaciones correctas.
7. Revisar resultados en reportes.
8. Capturar la evaluación de jefatura o coordinación cuando aplique.
9. Exportar `PDF alumnos`, `PDF institucional` y `Excel`.
10. Ejecutar respaldo al cierre del período o de la jornada.

## Sincronización académica

La sincronización académica trae información desde Horarios y actualiza:

- carreras
- docentes
- materias
- grupos
- asignaciones reales por grupo

### Recomendaciones

- usar `Actualizar catálogo completo` solo cuando se esté sincronizando todo lo vigente en Horarios;
- confirmar que exista período activo antes de sincronizar;
- revisar el resumen final de altas, actualizaciones, inactivaciones o retiros;
- evitar editar manualmente registros sincronizados, salvo campos locales permitidos.

## Importación de alumnos

La importación de alumnos sigue siendo local en Evaluación Docente.

### Antes de importar

- confirmar que la carrera exista ya sincronizada desde Horarios;
- confirmar que el grupo exista ya sincronizado en el período activo;
- validar matrícula, nombres, carrera y grupo en el CSV;
- usar exactamente los códigos de carrera y grupo que el sistema ya muestra.

### Consideraciones

- la contraseña inicial puede quedar vacía y entonces se usa la matrícula;
- si se activa `Actualizar lista del período activo`, el sistema ajusta el roster del período sin borrar historial;
- la importación no debe usarse para crear grupos o carreras nuevas.

## Evaluación de jefatura o coordinación

- registrar la calificación correspondiente;
- capturar observaciones claras y útiles para los reportes;
- usar la plantilla oficial si el proceso se realiza mediante importación.

## Uso de reportes

La vista de reportes permite:

- filtrar por período, carrera, materia y grupo;
- revisar resultados por docente;
- revisar observaciones de jefatura o coordinación;
- exportar resultados en `PDF institucional`, `PDF alumnos` y `Excel`;
- consultar información consolidada por carrera, materia o grupo.

## Control de administradores

Desde `Administradores` se puede:

- crear otra cuenta admin;
- restablecer la contraseña de otra cuenta admin;
- desactivar una cuenta admin.

Todas estas acciones requieren reautenticación del administrador activo y quedan registradas en logs.

## Recomendaciones de cierre

- revisar la bitácora administrativa;
- confirmar que la sincronización más reciente no dejó advertencias pendientes;
- validar que los reportes del período sean consistentes;
- guardar respaldo de la base de datos;
- resguardar los PDFs institucionales del período.
