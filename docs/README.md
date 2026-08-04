# MediaHub Documentation Sitemap

Welcome to the **MediaHub** documentation repository. Below is the sitemap of architectural decision records, system diagrams, developer platform manuals, commercial SaaS guides, deployment manuals, and API specifications.

---

## 🏢 Commercial SaaS & Multi-Tenancy
- 💼 [Commercial SaaS Architecture & Manual](file:///g:/Harry/02.%20Development/MediaHub/docs/saas-guide.md): Details Organization Tenancy, Project Resource Boundaries, RBAC Matrix, Stripe Billing Tiers, Quota Enforcement, Service Accounts, and Multi-Tenant REST API endpoints.

---

## 🛠️ Developer Platform & SDKs
- 📖 [Developer Platform Integration Guide](file:///g:/Harry/02.%20Development/MediaHub/docs/developer-guide.md): Details API Key Authentication, Scopes, TypeScript SDK (`@mediahub/sdk`), Terminal CLI (`mediahub`), and Webhook HMAC SHA-256 Signature Verification.

---

## 📐 System Architecture & Diagrams
- 📊 [System Overview & Architecture Diagrams](file:///g:/Harry/02.%20Development/MediaHub/docs/architecture/system-overview.md): Includes High-Level Architecture, Download Pipeline Sequence Diagram, Queue Lifecycle State Machine, Storage Class Diagram, and Package Dependency Graph.

---

## 📑 Architecture Decision Records (ADRs)
- 📝 [ADR 001: Selection of Hono Web Framework Over Express](file:///g:/Harry/02.%20Development/MediaHub/docs/adr/001-hono-over-express.md)
- 📝 [ADR 002: Modular Monorepo Architecture with Independent Infrastructure Packages](file:///g:/Harry/02.%20Development/MediaHub/docs/adr/002-decoupled-infrastructure-packages.md)

---

## 🚀 Deployment & Operations
- 🐳 [Cloud Deployment & Operations Guide](file:///g:/Harry/02.%20Development/MediaHub/docs/deployment.md): Instructions for Docker Compose, Kubernetes manifests, Helm charts, and backup/restore scripts.
- 📡 [OpenAPI 3.1 Specification](file:///g:/Harry/02.%20Development/MediaHub/docs/openapi.json): Full OpenAPI 3.1 schema for Public REST API endpoints (`/api/v1/public/`).
