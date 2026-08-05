# MediaHub Operations Manual

This guide describes operational procedures, monitoring endpoints, alert definitions, and troubleshooting workflows for the MediaHub production platform.

---

## 1. Health & Telemetry Endpoints

- **Global Health**: `GET /health`
  Returns status `200 OK` when API Gateway is online.
- **Liveness Probe**: `GET /health/live`
  Used by Kubernetes/Docker health checkers to confirm process is responsive.
- **Readiness Probe**: `GET /health/ready`
  Verifies connection to PostgreSQL database and Redis cluster.
- **Prometheus Metrics**: `GET /metrics`
  Exposes standard Prometheus counters, histograms, and gauges.

---

## 2. Key Operational Metrics

| Metric Name | Type | Description |
| :--- | :--- | :--- |
| `mediahub_http_requests_total` | Counter | Total HTTP requests handled by API Gateway |
| `mediahub_http_request_duration_seconds` | Histogram | Request latency distribution |
| `mediahub_downloads_total` | Counter | Total media extraction requests processed |
| `mediahub_queue_active_jobs` | Gauge | Active BullMQ background queue jobs |
| `mediahub_queue_failed_jobs` | Counter | Failed background processing jobs |

---

## 3. Recommended Alert Rules

1. **High Error Rate**: `rate(mediahub_http_requests_total{status=~"5.."}[5m]) > 0.05`
   - Trigger: > 5% of API requests returning 5xx status codes over 5 minutes.
2. **Worker Queue Backlog**: `mediahub_queue_active_jobs > 500`
   - Trigger: More than 500 queued downloads waiting for processing.
3. **Database Disconnection**: `mediahub_ready_status == 0`
   - Trigger: Readiness probe failing due to DB network issues.
