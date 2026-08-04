# MediaHub Production Worker Deployment Guide

This guide details the multi-replica, distributed deployment of the **MediaHub Worker Daemon (`apps/worker`)**.

---

## 🏗️ Independent Worker Deployment Topologies

In high-throughput enterprise environments, worker processes should be deployed independently with targeted replica counts and dedicated resource limits.

```
                    ┌─────────────────────────┐
                    │    Redis / BullMQ       │
                    └────────────┬────────────┘
                                 │
     ┌───────────────────┬───────┴───────────┬───────────────────┐
     │                   │                   │                   │
┌────▼─────────────┐ ┌───▼─────────────┐ ┌───▼─────────────┐ ┌───▼─────────────┐
│ Download Workers │ │ Webhook Workers │ │Analytics Workers│ │ Maintenance     │
│   (10 Replicas)  │ │   (2 Replicas)  │ │   (1 Replica)   │ │   (1 Replica)   │
└──────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 📦 Kubernetes Deployment Manifests (`helm/values.yaml`)

```yaml
workers:
  download:
    replicaCount: 10
    resources:
      limits:
        cpu: "2000m"
        memory: "4Gi"
      requests:
        cpu: "500m"
        memory: "1Gi"
    env:
      WORKER_MODULE: "downloads"
      QUEUE_CONCURRENCY: 20

  webhook:
    replicaCount: 2
    resources:
      limits:
        cpu: "500m"
        memory: "1Gi"
      requests:
        cpu: "100m"
        memory: "256Mi"
    env:
      WORKER_MODULE: "webhooks"
      QUEUE_CONCURRENCY: 50

  analytics:
    replicaCount: 1
    resources:
      limits:
        cpu: "1000m"
        memory: "2Gi"
    env:
      WORKER_MODULE: "analytics"

  maintenance:
    replicaCount: 1
    resources:
      limits:
        cpu: "500m"
        memory: "1Gi"
    env:
      WORKER_MODULE: "maintenance"
```

---

## 📊 Worker Telemetry & Monitoring

Inspect live worker health and queue velocity at any time:

```bash
curl http://localhost:4000/health/workers
```

### Metrics Output:
- `activeWorkerReplicas`: Count of connected worker containers.
- `queueLag`: Number of pending jobs across all queues.
- `jobsPerSecond`: Real-time processing velocity.
- `redlockStatus`: Distributed lock state.
