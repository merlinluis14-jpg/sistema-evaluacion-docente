#!/bin/bash
set -euo pipefail

# ============================================================
# Restauracion de PostgreSQL para Linux/macOS
# Sistema de Evaluacion Docente - UPTX
# ============================================================

if [[ $# -lt 1 ]]; then
  echo "Uso:"
  echo "  ./scripts/restore.sh /ruta/al/backup.dump"
  exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "[ERROR] El archivo de respaldo no existe:"
  echo "$BACKUP_FILE"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
DB_URL="${DATABASE_URL:-}"

if [[ -z "$DB_URL" && -f "$ENV_FILE" ]]; then
  DB_URL="$(grep '^DATABASE_URL=' "$ENV_FILE" | head -n 1 | cut -d= -f2- || true)"
  DB_URL="${DB_URL%\"}"
  DB_URL="${DB_URL#\"}"
fi

if [[ -z "$DB_URL" ]]; then
  DB_URL="postgresql://postgres:password@localhost:5432/sistema_evaluacion"
fi

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "[ERROR] No se encontro pg_restore en el PATH."
  echo "Instala PostgreSQL Client Tools antes de ejecutar este script."
  exit 1
fi

echo "Restaurando respaldo..."
pg_restore --clean --if-exists --no-owner --no-privileges -d "$DB_URL" "$BACKUP_FILE"

echo "[OK] Restauracion completada desde:"
echo "$BACKUP_FILE"
