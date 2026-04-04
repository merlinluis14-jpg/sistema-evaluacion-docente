param(
  [string]$TaskName = "UPTX-Evaluacion-Docente-Backup",
  [string]$StartTime = "02:00"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$taskScript = Join-Path $scriptDir "daily-backup-task.bat"
$backupDir = Join-Path $projectDir "backups"

if (-not (Test-Path $taskScript)) {
  throw "No se encontro el script de tarea diaria: $taskScript"
}

if (-not (Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$taskScript`""
$trigger = New-ScheduledTaskTrigger -Daily -At $StartTime
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description "Respaldo diario del Sistema de Evaluacion Docente UPTX" `
  -Force | Out-Null

Write-Host "[OK] Tarea registrada: $TaskName a las $StartTime"
Write-Host "Script ejecutado: $taskScript"
