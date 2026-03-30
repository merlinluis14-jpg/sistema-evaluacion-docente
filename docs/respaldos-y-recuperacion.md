# Respaldos y recuperacion

## Objetivo

Mantener continuidad operativa mediante respaldos periodicos de PostgreSQL y un procedimiento claro de restauracion.

## Scripts incluidos

- Windows:
  - `scripts/backup.bat`
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
