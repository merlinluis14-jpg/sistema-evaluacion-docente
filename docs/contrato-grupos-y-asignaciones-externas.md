# Contrato Requerido para Grupos y Asignaciones Externas

## Objetivo

Permitir que `sistema-evaluacion-docente` consuma desde el sistema externo la relacion real:

`carrera -> grupo -> materia -> profesor`

Con esto se busca:

- sincronizar grupos academicos
- sincronizar materias por grupo
- sincronizar el profesor correcto por materia dentro de cada grupo
- evitar asumir que una materia siempre tiene el mismo docente para todos los grupos

## Problema actual

La integracion local actual solo consume:

- carreras
- docentes
- materias
- relacion `docente -> materia -> carrera`

Eso no alcanza para reconstruir el modelo real del sistema externo, porque alla existe una asignacion especifica por grupo.

Ejemplo del sistema externo:

- Grupo `1M111`
- Materia `ING`
- Profesor `Merlin Gamer`

Hoy esa informacion ya aparece documentada en la API academica externa, pero
todavia no se consume en `sistema-evaluacion-docente`.

## Endpoints ya documentados por el sistema externo

### 1. Listado de grupos

`GET /api/ext/grupos?activo=true`

#### Respuesta recomendada

```json
{
  "total": 1,
  "grupos": [
    {
      "id": 10,
      "codigo": "1M111",
      "numero_grupo": 1,
      "turno": "M",
      "turno_nombre": "Matutino",
      "cuatrimestre": 1,
      "activo": true,
      "carrera": {
        "id": 11,
        "codigo": "111",
        "nombre": "Ingenieria en Electronica y Telecomunicaciones"
      }
    }
  ]
}
```

#### Campos obligatorios

- `id`
- `codigo`
- `numero_grupo`
- `turno`
- `cuatrimestre`
- `activo`
- `carrera.id`
- `carrera.codigo`
- `carrera.nombre`

### 2. Detalle de grupo con materias

`GET /api/ext/grupos/<id>/materias`

#### Respuesta recomendada

```json
{
  "id": 10,
  "codigo": "1M111",
  "numero_grupo": 1,
  "turno": "M",
  "turno_nombre": "Matutino",
  "cuatrimestre": 1,
  "activo": true,
  "carrera": {
    "id": 11,
    "codigo": "111",
    "nombre": "Ingenieria en Electronica y Telecomunicaciones"
  },
  "materias": [
    {
      "id": 25,
      "codigo": "ING",
      "nombre": "Ingles",
      "cuatrimestre": 1,
      "activa": true
    }
  ]
}
```

### 3. Asignaciones por grupo

`GET /api/ext/asignaciones-grupo?activo=true`

Este es el endpoint mas importante.

Debe devolver la asignacion exacta:

- grupo
- carrera
- materia
- profesor

#### Respuesta recomendada

```json
{
  "total": 1,
  "asignaciones": [
    {
      "grupo": {
        "id": 10,
        "codigo": "1M111",
        "numero_grupo": 1,
        "turno": "M",
        "turno_nombre": "Matutino",
        "cuatrimestre": 1,
        "activo": true
      },
      "carrera": {
        "id": 11,
        "codigo": "111",
        "nombre": "Ingenieria en Electronica y Telecomunicaciones"
      },
      "materia": {
        "id": 25,
        "codigo": "ING",
        "nombre": "Ingles",
        "cuatrimestre": 1,
        "creditos": 3,
        "horas_semanales": 5,
        "activa": true
      },
      "profesor": {
        "id": 42,
        "username": "Merlin",
        "nombre": "Merlin",
        "apellido": "Gamer",
        "nombre_completo": "Merlin Gamer",
        "email": "merlin@gmail.com",
        "tipo_profesor": "profesor_completo",
        "activo": true
      },
      "activo": true,
      "updated_at": "2026-04-11T13:45:00Z"
    }
  ]
}
```

#### Campos obligatorios

##### Grupo

- `id`
- `codigo`
- `numero_grupo`
- `turno`
- `cuatrimestre`
- `activo`

##### Carrera

- `id`
- `codigo`
- `nombre`

##### Materia

- `id`
- `codigo`
- `nombre`
- `cuatrimestre`
- `activa`

##### Profesor

- `id`
- `username`
- `nombre`
- `apellido`
- `nombre_completo`
- `email`
- `tipo_profesor`
- `activo`

##### Asignacion

- `activo`
- `updated_at`

## Filtros recomendados

Estos filtros harian la integracion mas eficiente:

- `carrera_id=<int>`
- `cuatrimestre=<int>`
- `grupo_id=<int>`
- `profesor_id=<int>`
- `activo=true|false`
- `updated_since=<ISO8601>`

## Reglas de integracion local propuestas

Cuando esta API exista, el sistema local debe trabajar asi:

### Grupos

- crear o actualizar grupos por `grupo.id` externo
- guardar `codigo`, `turno`, `cuatrimestre` y carrera
- desactivar grupos faltantes solo en sincronizacion completa

### Materias

- seguir creando o actualizando materias por `materia.codigo + carrera`
- permitir que una misma materia tenga distinto docente segun el grupo

### Asignacion docente-materia-grupo

La representacion local recomendada es esta:

- mantener `Subject` como catalogo de materia
- mantener `Group` como catalogo de grupo
- convertir la relacion `GroupSubject` en una asignacion completa agregando `teacherId`

Eso permite representar:

- grupo `1M111`
- materia `ING`
- docente `Merlin Gamer`

sin duplicar la materia en cada grupo.

## Propuesta de ajuste del esquema local

### Group

Agregar:

- `externalId`
- `externalCode`
- `cuatrimestre`
- `shift`
- `managedByExternal`
- `lastExternalSyncAt`

### GroupSubject

Agregar:

- `teacherId`
- `teacher`
- `managedByExternal`
- `lastExternalSyncAt`

Con esto `GroupSubject` pasa de ser solo pivote a representar la asignacion real.

## Impacto funcional esperado

Cuando esta parte quede integrada, el alumno vera solo las materias de su grupo con el docente correcto.

Eso evita errores como:

- mostrar un docente incorrecto para la misma materia
- mezclar grupos distintos bajo una sola materia
- evaluar al profesor equivocado

## Estado actual

Al 11 de abril de 2026:

- el sistema externo ya documento `GET /api/ext/grupos`
- el sistema externo ya documento `GET /api/ext/grupos/<id>/materias`
- el sistema externo ya documento `GET /api/ext/asignaciones-grupo`
- el sistema local ya puede desactivar materias para quedarse solo con el catalogo externo activo
- lo pendiente ahora ya no es pedir el contrato, sino adaptar la sincronizacion local para consumir grupos y asignaciones por grupo

## Siguiente paso local

Implementar en `sistema-evaluacion-docente`:

1. consumo de `GET /api/ext/grupos?activo=true`
2. consumo de `GET /api/ext/asignaciones-grupo?activo=true`
3. migracion local para que `GroupSubject` guarde tambien el `teacherId`
4. sincronizacion de grupos externos sin depender solo de importaciones CSV de alumnos
