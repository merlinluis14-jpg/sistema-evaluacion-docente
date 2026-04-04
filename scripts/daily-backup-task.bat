@echo off
setlocal enableextensions enabledelayedexpansion

REM ============================================================
REM Wrapper para tarea programada de respaldo diario
REM Sistema de Evaluacion Docente - UPTX
REM ============================================================

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_DIR=%%~fI"
set "BACKUP_DIR=%PROJECT_DIR%\backups"
set "LOG_FILE=%BACKUP_DIR%\daily-backup.log"

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo ===========================================================>> "%LOG_FILE%"
echo [%date% %time%] Inicio de respaldo diario>> "%LOG_FILE%"
call "%SCRIPT_DIR%backup.bat" >> "%LOG_FILE%" 2>&1
set "EXIT_CODE=%ERRORLEVEL%"
echo [%date% %time%] Fin de respaldo diario. Codigo=!EXIT_CODE!>> "%LOG_FILE%"
exit /b %EXIT_CODE%
