param(
  [string]$TaskName = "UPTX-Evaluacion-Docente-Backup"
)

$ErrorActionPreference = "Stop"

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "[OK] Tarea eliminada: $TaskName"
} else {
  Write-Host "[INFO] La tarea no existe: $TaskName"
}
