# Respaldos y recuperacion

## Objetivo

Mantener continuidad operativa mediante respaldos periodicos de PostgreSQL y un procedimiento claro de restauracion.

## Cobertura institucional recomendada

Para el despliegue de tesina se considera como base productiva una instancia administrada en **Supabase**, donde la plataforma ofrece **respaldos diarios** y cifrado de la base de datos. Los scripts de este repositorio funcionan como respaldo complementario o alternativa para entornos locales.

## Scripts incluidos

- Windows:
  - `scripts/backup.bat`
  - `scripts/daily-backup-task.bat`
  - `scripts/register-daily-backup-task.ps1`
  - `scripts/unregister-daily-backup-task.ps1`
  - `scripts/restore.bat`
- Linux/macOS:
  - `scripts/backup.sh`
  - `scripts/restore.sh`

Los scripts leen `DATABASE_URL` desde `.env` cuando esta disponible.

## Generar respaldo

### Windows

```bat
scripts\backup.bat
```

### Linux/macOS

```bash
./scripts/backup.sh
```

El respaldo se guarda en la carpeta `backups/` del proyecto con formato `backup_YYYY-MM-DD_HH-mm-ss.dump`.
Cuando se usa la tarea diaria de Windows, tambien se agrega una traza de ejecucion en `backups/daily-backup.log`.

## Restaurar respaldo

### Windows

```bat
scripts\restore.bat "C:\ruta\al\backup.dump"
```

### Linux/macOS

```bash
./scripts/restore.sh /ruta/al/backup.dump
```

La restauracion usa `pg_restore --clean --if-exists`, por lo que se debe ejecutar solo sobre la base que se desea reemplazar.

## Programacion diaria

### Windows Task Scheduler

#### Registro automatico recomendado

Ejecutar PowerShell como administrador y registrar la tarea incluida:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register-daily-backup-task.ps1
```

La tarea `UPTX-Evaluacion-Docente-Backup` queda programada para correr todos los dias a las `02:00` y ejecuta `scripts/daily-backup-task.bat`.

Para eliminarla:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\unregister-daily-backup-task.ps1
```

#### Configuracion manual

1. Abrir `Programador de tareas`.
2. Crear tarea basica.
3. Frecuencia: diaria.
4. Accion: iniciar programa.
5. Programa: `cmd.exe`
6. Argumentos:

```bat
/c "C:\ruta\al\proyecto\scripts\backup.bat"
```

### Cron en Linux/macOS

Ejemplo para ejecutar a las 02:00:

```bash
0 2 * * * /ruta/al/proyecto/scripts/backup.sh
```

## Buenas practicas

- conservar copias fuera del equipo local si la operacion es institucional
- validar al menos una restauracion de prueba antes de la entrega
- ejecutar respaldo antes de cambios grandes de datos
- no sobrescribir manualmente los respaldos historicos
- revisar periodicamente `backups/daily-backup.log` para confirmar ejecuciones programadas
- documentar en entrega si la operacion principal corre sobre Supabase para respaldar `RNF5`
