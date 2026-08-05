#!/bin/bash
set -e

# MediaHub PostgreSQL Database Restoration & Verification Script
if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file '$BACKUP_FILE' does not exist."
  exit 1
fi

echo "[MediaHub Restore] Restoring PostgreSQL database from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | psql "${DATABASE_URL}"

echo "[MediaHub Restore] Running Prisma database migration verification..."
npx prisma migrate status

echo "[MediaHub Restore] Database restoration and migration check completed successfully!"
