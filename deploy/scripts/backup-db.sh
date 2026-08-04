#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/mediahub_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "📦 Creating database dump..."
pg_dump -h localhost -U mediahub_user -d mediahub_db | gzip > "${BACKUP_FILE}"

echo " Backup completed: ${BACKUP_FILE}"
