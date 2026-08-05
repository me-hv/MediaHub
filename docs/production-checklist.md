# MediaHub Production Deployment Checklist

This document details the mandatory pre-flight checks before launching **MediaHub v1.0.0** to cloud infrastructure.

---

## 1. Environment & Infrastructure
- [ ] Ensure PostgreSQL database is provisioned (PostgreSQL 16+).
- [ ] Ensure Redis instance is provisioned for BullMQ queues and caching.
- [ ] Set `NODE_ENV=production` across all services (`web`, `api`, `worker`).
- [ ] Configure `DATABASE_URL` and `REDIS_URL` in environment secrets.

## 2. Domain & Security
- [ ] Domain DNS mapped to production Nginx reverse proxy / Load Balancer.
- [ ] SSL/TLS certificate installed (Let's Encrypt / AWS ACM).
- [ ] Verify Content-Security-Policy (CSP) headers in `docker/nginx/nginx.conf`.
- [ ] Verify CORS allowed origins in `apps/api/src/server.ts`.

## 3. Database Operations
- [ ] Run production database migrations: `npx prisma migrate deploy`.
- [ ] Seed initial platform features and plan quotas: `npx prisma db seed`.
- [ ] Verify automated daily backup cron execution (`deployment/scripts/backup-db.sh`).

## 4. Observability & Health Probes
- [ ] Verify HTTP GET `/health` endpoint returns `200 OK`.
- [ ] Verify HTTP GET `/health/live` and `/health/ready` endpoints respond correctly.
- [ ] Verify Prometheus metrics endpoint `/metrics` is scraped by monitoring collector.

## 5. Background Workers & Downloader Binaries
- [ ] Verify `yt-dlp` binary is accessible inside the `worker` container (`python -m yt_dlp --version`).
- [ ] Verify `ffmpeg` binary is installed in worker image for media transcoding.
- [ ] Confirm BullMQ worker queues (`downloads`, `webhooks`, `analytics`, `maintenance`) are connected to Redis.
