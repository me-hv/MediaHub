# ADR 002: Modular Monorepo Architecture with Independent Infrastructure Packages

## Context
MediaHub Phase 1 was a monolithic application structure. As features expanded to include Queueing, Events, Storage, Cache, Metrics, and Telemetry, coupling these concerns directly inside the Web/API application layer created architectural friction and prevented independent testing.

## Decision
We extracted cross-cutting infrastructure into dedicated monorepo packages under `packages/`:
- `packages/queue`
- `packages/storage`
- `packages/cache`
- `packages/metrics`
- `packages/telemetry`
- `packages/platform`
- `packages/events`
- `packages/downloader`
- `packages/types`
- `packages/config`
- `packages/utils`

## Rationale
- **Dependency Inversion**: Application code depends strictly on abstract interfaces (`IStorageProvider`, `QueueManager`, `PlatformProbes`).
- **Independent Testability**: Each package maintains isolated Vitest test suites.
- **Reusability**: Storage or Queue engines can be published or reused across CLI tools, worker services, or cloud microservices without importing API web code.

## Consequences
- Requires pnpm monorepo workspace management (`pnpm-workspace.yaml`).
