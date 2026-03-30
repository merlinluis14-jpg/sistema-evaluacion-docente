@echo off
setlocal enableextensions enabledelayedexpansion

REM ============================================================
REM Restauracion de PostgreSQL para Windows
REM Sistema de Evaluacion Docente - UPTX
REM ============================================================

if "%~1"=="" (
  echo Uso:
  echo   scripts\restore.bat "C:\ruta\al\backup.dump"
  exit /b 1
)

set "BACKUP_FILE=%~1"
if not exist "%BACKUP_FILE%" (
  echo [ERROR] El archivo de respaldo no existe:
  echo %BACKUP_FILE%
  exit /b 1
)

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_DIR=%%~fI"
set "ENV_FILE=%PROJECT_DIR%\.env"
set "DB_URL="

if exist "%ENV_FILE%" (
  for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
    if /i "%%A"=="DATABASE_URL" set "DB_URL=%%B"
  )
)

if not defined DB_URL set "DB_URL=postgresql://postgres:password@localhost:5432/sistema_evaluacion"
set "DB_URL=%DB_URL:"=%"

where pg_restore >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro pg_restore en el PATH.
  echo Instala PostgreSQL Client Tools o agrega pg_restore al PATH del sistema.
  exit /b 1
)

echo Restaurando respaldo...
pg_restore --clean --if-exists --no-owner --no-privileges -d "%DB_URL%" "%BACKUP_FILE%"

if errorlevel 1 (
  echo [ERROR] Fallo la restauracion.
  exit /b 1
)

echo [OK] Restauracion completada desde:
echo %BACKUP_FILE%
exit /b 0
