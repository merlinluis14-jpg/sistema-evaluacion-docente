# Plan de Integracion con Gestor de Horarios

## Objetivo

Integrar el sistema `Gestor de Horarios` como sistema maestro de catalogos academicos para que el sistema `Evaluacion Docente` consuma y sincronice automaticamente:

- carreras
- docentes
- materias asignadas a docentes

La captura inicial de esos datos se realizara en el sistema de horarios.  
El sistema de evaluacion docente dejara de depender de captura manual duplicada para esos catalogos.

## Principio de operacion

La integracion debe ser unidireccional:

`Gestor de Horarios -> Evaluacion Docente`

### Fuente de verdad por sistema

#### Gestor de Horarios

- carreras
- docentes
- materias
- relaciones docente-materia-carrera
- disponibilidad docente

#### Evaluacion Docente

- alumnos
- periodos de evaluacion
- evaluaciones capturadas
- resultados
- reportes
- bitacoras administrativas

## Objetivo funcional para el usuario

La jefa de carrera captura primero en el sistema de horarios.  
Despues, desde el sistema de evaluacion docente, un administrador ejecuta una sincronizacion para traer la informacion actualizada.

El usuario no debe volver a capturar manualmente en evaluacion docente los docentes, materias o carreras que ya existen en el sistema de horarios.

## Alcance recomendado

### Fase 1

Integracion de catalogos:

- sincronizar carreras
- sincronizar docentes
- sincronizar materias asignadas a docentes
- registrar trazabilidad de sincronizacion
- mostrar vista previa y resumen de cambios
- desactivar registros faltantes solo en sincronizacion completa

### Fase 2

Mejoras operativas:

- sincronizacion incremental por fecha de actualizacion
- ejecucion programada
- bloqueo o aviso de edicion manual sobre registros sincronizados

### Fase 3 opcional

Unificacion de autenticacion de docentes:

- login docente validado contra el sistema externo
- sesion local creada con NextAuth

Esta fase es opcional y no es necesaria para arrancar la integracion de catalogos.

## Flujo operativo propuesto

1. La jefa de carrera actualiza docentes, carreras y materias en el sistema de horarios.
2. El administrador entra al sistema de evaluacion docente.
3. Usa la opcion `Sincronizar desde Gestor de Horarios`.
4. El sistema consulta la API externa.
5. El sistema muestra vista previa de cambios.
6. El administrador confirma la sincronizacion.
7. El sistema crea, actualiza o desactiva registros locales.
8. Las evaluaciones y reportes siguen usando la base local ya sincronizada.

## Reglas de negocio de la integracion

1. El sistema externo es el sistema maestro para catalogos docentes.
2. Los registros sincronizados no deben eliminarse fisicamente si ya tienen historial local.
3. Los registros que desaparezcan del sistema externo deben marcarse como inactivos en sincronizacion completa.
4. La sincronizacion parcial no debe desactivar registros.
5. La identidad de un docente no debe depender solo del email.
6. La identidad de una materia no debe depender solo del nombre.
7. Deben guardarse los IDs externos para futuras resincronizaciones.
8. Toda sincronizacion debe quedar registrada en `AdminLog` o en una bitacora dedicada.

## Riesgos que hay que resolver antes de implementar

### 1. Multi-carrera en el sistema externo

El sistema externo permite que un profesor pertenezca a multiples carreras.  
El sistema local hoy modela al docente con una sola carrera principal.

### 2. Relacion materia-docente

El sistema local necesita saber que docente imparte que materia y en que carrera.  
No basta con recibir solo el catalogo de docentes si no viene la relacion exacta con materias.

### 3. Identidad externa estable

Si la sincronizacion se hace por email o username sin guardar `externalId`, habra duplicados y errores cuando cambie algun dato.

### 4. Desactivaciones accidentales

No se debe ejecutar `syncCatalog` sobre un subconjunto parcial de registros.

## Cambios requeridos en Evaluacion Docente

## 1. Cambios de datos

Agregar trazabilidad de origen externo.

### Carreras

- `externalId` entero o string unico
- `managedByExternal` boolean
- `lastExternalSyncAt`

### Docentes

- `externalId` entero o string unico
- `externalUsername`
- `managedByExternal`
- `lastExternalSyncAt`

### Materias

- `externalId` entero o string unico
- `managedByExternal`
- `lastExternalSyncAt`

### Relacion docente-carrera

Se recomienda adaptar el modelo local para soportar multiples carreras por docente, porque el sistema externo ya trabaja asi.

Opciones:

- opcion recomendada: crear relacion many-to-many `TeacherCareer`
- opcion temporal: guardar solo una carrera principal y registrar el resto como observacion o snapshot

La opcion recomendada es la primera.

## 2. Capa de integracion

Crear o completar una capa dedicada para consumir la API externa:

- `pingGestorApi()`
- `getCatalogoCarrerasExternas()`
- `getCatalogoDocentesExternos()`
- `getAsignacionesExternasDocenteMateria()`

Tambien debe incluir:

- validacion de respuestas
- normalizacion de datos
- manejo de timeouts
- mensajes de error entendibles

## 3. Servicio de sincronizacion

Implementar un servicio transaccional con este orden:

1. sincronizar carreras
2. sincronizar docentes
3. sincronizar materias y asignaciones
4. desactivar faltantes si es sincronizacion completa
5. guardar resumen final

Cada paso debe ser idempotente.

## 4. Interfaz administrativa

Crear o completar una pantalla de sincronizacion con:

- prueba de conectividad
- consulta de catalogo externo
- conteo de registros detectados
- vista previa de altas, cambios y bajas logicas
- boton de sincronizar
- resumen final con errores y exitos

## 5. Restricciones de uso

Cuando un registro venga del sistema externo, la UI debe marcarlo como:

- `Sincronizado desde Gestor de Horarios`

Y se recomienda:

- bloquear su edicion manual
- o permitir solo ciertos campos locales no controlados por el sistema externo

## Orden de implementacion

### Etapa 1. Definir contrato con el sistema externo

Entregables:

- lista de endpoints
- estructura JSON pactada
- campos obligatorios
- criterio de identidad externa
- criterio de activos e inactivos

### Etapa 2. Adaptar el modelo local

Entregables:

- migracion Prisma
- campos `externalId`
- marca de registros administrados externamente
- soporte de multi-carrera si se aprueba

### Etapa 3. Implementar cliente de API externa

Entregables:

- funciones de consumo
- manejo de errores
- pruebas de conectividad

### Etapa 4. Implementar sincronizacion de carreras

Entregables:

- upsert por `externalId`
- desactivacion controlada
- logs

### Etapa 5. Implementar sincronizacion de docentes

Entregables:

- upsert por `externalId`
- actualizacion de email, nombre, apellido y tipo
- guardado de `externalUsername`

### Etapa 6. Implementar sincronizacion de materias y asignaciones

Entregables:

- upsert de materias
- relacion correcta con carrera
- relacion correcta con docente

### Etapa 7. Integrar interfaz administrativa

Entregables:

- pagina de sincronizacion
- vista previa
- resumen final

### Etapa 8. Pruebas piloto

Casos minimos:

- alta nueva
- actualizacion de nombre o email
- cambio de carrera
- desactivacion de docente
- desactivacion de materia
- conflicto de datos
- reejecucion sin duplicados

### Etapa 9. Despliegue controlado

Acciones:

- respaldo previo
- primera sincronizacion manual
- validacion con la jefa de carrera
- activacion operativa

## APIs que se deben solicitar al sistema externo

## Opcion recomendada

La opcion mas limpia es pedir una API dedicada especificamente para `Evaluacion Docente`, en lugar de reconstruir todo a partir de varios endpoints sueltos.

### 1. Ping de integracion

`GET /api/integracion/evaluacion-docente/ping`

Uso:

- verificar conectividad
- verificar que la API este disponible antes de sincronizar

Respuesta minima:

```json
{
  "status": "ok",
  "message": "Integracion de evaluacion docente activa"
}
```

### 2. Catalogo completo para Evaluacion Docente

`GET /api/integracion/evaluacion-docente/catalogo?activo=true`

Este endpoint debe devolver, en un solo contrato, la relacion exacta que tu sistema necesita:

- docente
- carrera
- materia

Respuesta recomendada:

```json
{
  "generated_at": "2026-04-10T12:00:00Z",
  "total_registros": 3,
  "registros": [
    {
      "docente": {
        "id": 5,
        "username": "alejandra.heredia",
        "email": "alejandra.heredia@uptex.edu.mx",
        "nombre": "Alejandra",
        "apellido": "Heredia Celis",
        "tipo_profesor": "profesor_asignatura",
        "activo": true,
        "updated_at": "2026-04-09T14:00:00Z"
      },
      "carrera": {
        "id": 1,
        "codigo": "TISC",
        "nombre": "Tecnologia de la Informacion, Sistemas Computacionales",
        "activa": true,
        "updated_at": "2026-04-08T10:00:00Z"
      },
      "materia": {
        "id": 3,
        "codigo": "SIS-101",
        "nombre": "Programacion I",
        "cuatrimestre": 1,
        "activa": true,
        "updated_at": "2026-04-09T16:00:00Z"
      }
    }
  ]
}
```

Ventajas:

- evita ambiguedad entre materia, carrera y docente
- simplifica la implementacion del lado de evaluacion docente
- reduce errores de mapeo

### 3. Cambios incrementales

`GET /api/integracion/evaluacion-docente/cambios?since=2026-04-10T00:00:00Z`

Uso:

- sincronizaciones futuras mas rapidas
- traer solo cambios desde la ultima ejecucion

No es obligatorio para la primera fase, pero si es muy recomendable.

## Opcion alternativa si no quieren crear una API dedicada

Si el equipo externo prefiere exponer endpoints por entidad, entonces solicita como minimo:

### A. Ya existe y sirve

- `GET /api/profesores/ping`
- `GET /api/profesores?activo=true`
- `GET /api/profesores/<id>`

### B. Deben agregar

#### 1. Catalogo de carreras

`GET /api/carreras?activa=true`

Campos minimos por carrera:

- `id`
- `codigo`
- `nombre`
- `activa`
- `updated_at`

#### 2. Catalogo de materias

`GET /api/materias?activa=true`

Campos minimos por materia:

- `id`
- `codigo`
- `nombre`
- `cuatrimestre`
- `activa`
- `carrera`
- `updated_at`

#### 3. Asignaciones docente-materia-carrera

`GET /api/asignaciones-docente?activo=true`

Este endpoint es clave.  
Debe decir claramente que docente imparte que materia y para que carrera.

Campos minimos por asignacion:

- `docente_id`
- `materia_id`
- `carrera_id`
- `activo`
- `updated_at`

Sin este endpoint, el sistema local tendra que inferir relaciones y eso aumenta mucho el riesgo de errores.

## API opcional para una futura fase

### Autenticacion docente

`POST /api/auth/profesor`

Esta API ya existe en el sistema externo, pero no es necesaria para la fase inicial de sincronizacion de catalogos.

Solo debe usarse si despues decides unificar tambien el login docente.

## Campos obligatorios que deben venir del sistema externo

### Docente

- `id`
- `username`
- `email`
- `nombre`
- `apellido`
- `tipo_profesor`
- `activo`
- `updated_at`

### Carrera

- `id`
- `codigo`
- `nombre`
- `activa`
- `updated_at`

### Materia

- `id`
- `codigo`
- `nombre`
- `cuatrimestre`
- `activa`
- `updated_at`

### Asignacion

- `docente_id`
- `materia_id`
- `carrera_id`
- `activo`
- `updated_at`

## Criterios de aceptacion

Se considerara implementada correctamente la integracion cuando:

1. una carrera creada en el sistema externo pueda sincronizarse al sistema local
2. un docente nuevo del sistema externo pueda sincronizarse sin duplicarse
3. una materia nueva del sistema externo pueda sincronizarse con su carrera y docente correctos
4. un cambio de nombre o correo se refleje al resincronizar
5. un docente o materia inactivos en el sistema externo se marquen inactivos localmente en sincronizacion completa
6. el historial de evaluaciones no se pierda
7. una resincronizacion repetida no genere duplicados

## Recomendacion final

Para reducir complejidad y evitar confusion al usuario, la mejor solicitud al equipo del sistema externo es:

1. `GET /api/integracion/evaluacion-docente/ping`
2. `GET /api/integracion/evaluacion-docente/catalogo?activo=true`
3. `GET /api/integracion/evaluacion-docente/cambios?since=...` opcional

Si aceptan esa propuesta, la integracion sera mas simple, mas robusta y mas facil de mantener.
