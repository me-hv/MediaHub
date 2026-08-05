#!/bin/bash
set -e

# MediaHub PostgreSQL Automated Backup Script
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mediahub}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="mediahub_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[MediaHub Backup] Starting PostgreSQL database dump..."
pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[MediaHub Backup] Backup created successfully: ${BACKUP_DIR}/${FILENAME}"

# Retain backups for 30 days
find "$BACKUP_DIR" -type f -name "mediahub_backup_*.sql.gz" -mtime +30 -delete
echo "[MediaHub Backup] Purged backups older than 30 days."
