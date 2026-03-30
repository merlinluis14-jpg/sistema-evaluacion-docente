# Plan de pruebas del sistema

## Objetivo

Validar el flujo principal de operacion antes de la entrega final y durante pruebas con usuarios.

## Validaciones tecnicas

Ejecutar:

```bash
npm run lint
npm run typecheck
npm run test
```

## Escenarios funcionales

### 1. Autenticacion por roles

- Iniciar sesion como admin
- Iniciar sesion como docente
- Iniciar sesion como alumno
- Confirmar que cada rol solo accede a su area

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

## Resultado esperado

Si todos los escenarios anteriores son correctos, el sistema queda validado para presentacion de tesina y piloto institucional controlado.
