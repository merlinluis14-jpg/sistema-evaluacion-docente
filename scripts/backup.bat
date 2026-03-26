@echo off
REM ============================================================
REM Script automático de respaldo PostgreSQL para Windows (RNF5)
REM Sistema de Evaluación Docente - UPTX
REM ============================================================
REM USO:
REM Configurar en el Programador de Tareas de Windows para
REM ejecución diaria.
REM ============================================================

setlocal enabledelayedexpansion

REM Definir carpeta de respaldos
SET "BACKUP_DIR=.\backups"

REM Extraer DB_URL del archivo .env si existe (rudimentario)
SET "DB_URL=postgresql://postgres:password@localhost:5432/sed_db"
FOR /F "tokens=1,* delims==" %%A IN ('findstr "^DATABASE_URL=" ..\.env 2^>NUL') DO SET DB_URL=%%B
REM Eliminar comillas si las hay
SET DB_URL=%DB_URL:"=%

REM Obtener fecha y hora segura
FOR /f "tokens=2 delims==" %%I IN ('wmic os get localdatetime /value') DO SET datetime=%%I
SET "DATE=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%"
SET "FILE_NAME=backup_%DATE%.sql"

REM Crear directorio
IF NOT EXIST "%BACKUP_DIR%" MKDIR "%BACKUP_DIR%"

echo Iniciando respaldo automatico de la bd...
pg_dump "%DB_URL%" -F c -f "%BACKUP_DIR%\%FILE_NAME%"

IF %ERRORLEVEL% EQU 0 (
    echo [OK] Respaldo exitoso: %BACKUP_DIR%\%FILE_NAME%
) ELSE (
    echo [ERROR] Fallo al generar el respaldo de la base de datos.
)

endlocal
