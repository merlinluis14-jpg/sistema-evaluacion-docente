#!/bin/bash
# ============================================================
# Script automático de respaldo para PostgreSQL (RNF5)
# Sistema de Evaluación Docente — UPTX
# ============================================================
# USO:
# Para automatizar, añade este script a crontab:
# 0 2 * * * /ruta/al/proyecto/scripts/backup.sh
# ============================================================

# Si DATABASE_URL está definida en el entorno (.env), la intenta usar.
# De lo contrario puedes modificarla aquí.
DB_URL=${DATABASE_URL:-"postgresql://user:password@localhost:5432/sistema_evaluacion"}
BACKUP_DIR="./backups"
DATE=$(date +'%Y-%m-%d_%H-%M-%S')
FILE_NAME="backup_$DATE.sql"

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

echo "Iniciando respaldo automático de la BD..."

# Ejecutar pg_dump (requiere PostgreSQL clients instalados)
pg_dump "$DB_URL" -F c -f "$BACKUP_DIR/$FILE_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Respaldo exitoso: $BACKUP_DIR/$FILE_NAME"
    
    # Opcional: Rotación para conservar solo los últimos 7 días
    # find "$BACKUP_DIR" -type f -name "backup_*.sql" -mtime +7 -exec rm {} \;
    # echo "Limpieza de respaldos antiguos completada."
else
    echo "❌ Error durante el respaldo de la base de datos."
    exit 1
fi
