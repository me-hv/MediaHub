# MediaHub Deployment & Operations Guide

## Overview
MediaHub Phase 3 is designed for cloud-native deployment using Docker Compose, Kubernetes, or Helm.

---

## 1. Local Docker Compose Setup
```bash
# Start Postgres, Redis, API, Web, and NGINX Reverse Proxy
docker-compose -f docker-compose.prod.yml up -d --build

# Inspect logs
docker-compose -f docker-compose.prod.yml logs -f api
```

---

## 2. Kubernetes Deployment
```bash
# Apply raw Kubernetes manifests
kubectl apply -f k8s/

# Verify status
kubectl get pods -n mediahub
kubectl get svc -n mediahub
```

---

## 3. Helm Deployment
```bash
# Deploy using Helm
helm upgrade --install mediahub deploy/helm/mediahub -f deploy/helm/mediahub/values-production.yaml
```

---

## 4. Health & Observability Probes
- **Liveness**: `GET http://localhost:4000/live`
- **Readiness**: `GET http://localhost:4000/ready`
- **Full Health**: `GET http://localhost:4000/health`
- **Prometheus Metrics**: `GET http://localhost:4000/metrics`
- **Bull Board Queue Dashboard**: `GET http://localhost:4000/admin/queues`
