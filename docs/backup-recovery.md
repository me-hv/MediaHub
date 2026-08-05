# MediaHub Backup & Disaster Recovery Guide

This manual outlines backup routines, recovery point objectives (RPO), recovery time objectives (RTO), and disaster restoration workflows.

---

## 1. Targets & Metrics
- **Recovery Point Objective (RPO)**: 24 hours (daily database dumps).
- **Recovery Time Objective (RTO)**: < 30 minutes for complete service restoration.

---

## 2. Automated Backup Execution
Database backups are executed daily at 02:00 UTC using `deployment/scripts/backup-db.sh`:

```bash
# Execute manual backup
DATABASE_URL="postgresql://user:pass@host:5432/mediahub" ./deployment/scripts/backup-db.sh
```

Backups are saved as compressed SQL archives in `/var/backups/mediahub/mediahub_backup_YYYYMMDD_HHMMSS.sql.gz`.

---

## 3. Database Restoration Workflow

In the event of database corruption or data loss:

1. Stop API Gateway and Worker processes to prevent concurrent writes:
   ```bash
   docker compose -f deployment/docker-compose.prod.yml stop api worker
   ```

2. Restore database from latest backup archive:
   ```bash
   DATABASE_URL="postgresql://user:pass@host:5432/mediahub" ./deployment/scripts/restore-db.sh /var/backups/mediahub/mediahub_backup_20260805_020000.sql.gz
   ```

3. Restart all production services:
   ```bash
   docker compose -f deployment/docker-compose.prod.yml start api worker
   ```

4. Verify service health:
   ```bash
   curl -i http://localhost/health
   ```
