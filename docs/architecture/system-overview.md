# MediaHub System Architecture Diagrams

This document outlines the high-level architecture, request flows, queue lifecycle, storage abstraction, deployment topology, and monorepo package dependency graph of **MediaHub**.

---

## 1. High-Level System Architecture

```mermaid
graph TD
    Client["Browser / Client (Next.js 15 App Router)"]
    NGINX["NGINX Reverse Proxy & Rate Limiter (Port 80/443)"]
    API["Hono REST API Engine (Port 4000)"]
    Auth["Firebase Auth Service"]
    
    subgraph "Infrastructure Packages"
        Platform["@mediahub/platform (Probes, Shutdown, Security)"]
        Queue["@mediahub/queue (BullMQ + Redis)"]
        Downloader["@mediahub/downloader (Provider / Factory)"]
        Storage["@mediahub/storage (Local / R2 / S3)"]
        Cache["@mediahub/cache (Redis Cache)"]
        Metrics["@mediahub/metrics (Prometheus)"]
        Telemetry["@mediahub/telemetry (OpenTelemetry OTLP)"]
    end
    
    DB[(PostgreSQL Database)]
    Redis[(Redis Server)]
    CloudStorage["Cloudflare R2 / AWS S3 Bucket"]

    Client -->|HTTPS / REST| NGINX
    NGINX -->|Proxy / SSE| API
    API -->|Verify Token| Auth
    API --> Platform
    API --> Queue
    API --> Downloader
    API --> Storage
    API --> Cache
    API --> Metrics
    API --> Telemetry
    
    Queue -->|Jobs / DLQ| Redis
    Cache -->|Metadata & Stats| Redis
    Storage -->|Save Stream / Signed URLs| CloudStorage
    API -->|Prisma ORM| DB
```

---

## 2. Media Download Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js Web App
    participant API as Hono REST API
    participant Cache as Redis Cache
    participant Engine as YtDlpWrapper
    participant Storage as IStorageProvider
    participant History as PostgreSQL History

    User->>Web: Paste Media URL (e.g. YouTube / Instagram)
    Web->>API: POST /api/v1/analyze { url }
    API->>Cache: Check Metadata Cache (urlHash)
    alt Cache Hit
        Cache-->>API: Return Cached MediaMetadata
    else Cache Miss
        API->>Engine: extractMetadata(url)
        Engine-->>API: MediaMetadata (Title, Formats, Subtitles)
        API->>Cache: Save Metadata (TTL 6 Hours)
    end
    API-->>Web: Return JSON MediaMetadata
    
    User->>Web: Click Download (Format: 1080p / MP3)
    Web->>API: POST /api/v1/download { url, formatId }
    API->>Engine: getStream(url, formatId)
    Engine-->>API: Readable PassThrough Stream
    API->>Storage: saveStream(key, stream) / Pipe to HTTP
    API->>History: Add Download Record (COMPLETED)
    API-->>User: Stream Binary File Download
```

---

## 3. Queue Lifecycle & Multi-Job SSE Stream

```mermaid
stateDiagram-v2
    [*] --> QUEUED: User Enqueues Job
    QUEUED --> DOWNLOADING: Worker Picked (Concurrency <= 3)
    DOWNLOADING --> COMPLETED: Stream Finished Successfully
    DOWNLOADING --> QUEUED: Temporary Failure (Attempts < 3)
    DOWNLOADING --> FAILED: Hard Failure (Attempts >= 3)
    FAILED --> DeadLetterQueue: Pushed to DLQ
    QUEUED --> CANCELLED: Abort Requested
    DOWNLOADING --> CANCELLED: Abort Requested

    note right of QUEUED
        Emits SSE 'progress' event
        to /api/v1/progress/stream
    end note
```

---

## 4. Storage Provider Abstraction (`IStorageProvider`)

```mermaid
classDiagram
    class IStorageProvider {
        +saveStream(key, stream, contentType) Promise~string~
        +getStream(key) Promise~Readable~
        +exists(key) Promise~boolean~
        +delete(key) Promise~boolean~
        +getInfo(key) Promise~StorageObjectInfo~
        +getSignedUrl(key, expiresIn) Promise~string~
    }

    class LocalStorageProvider {
        -baseDir: string
        +saveStream()
        +getStream()
        +getSignedUrl()
    }

    class CloudflareR2StorageProvider {
        -accountId: string
        -bucketName: string
        +saveStream()
        +getSignedUrl()
    }

    class S3StorageProvider {
        -bucketName: string
        -region: string
        +saveStream()
        +getSignedUrl()
    }

    class StorageFactory {
        +getProvider(type) IStorageProvider
    }

    IStorageProvider <|.. LocalStorageProvider
    IStorageProvider <|.. CloudflareR2StorageProvider
    IStorageProvider <|.. S3StorageProvider
    StorageFactory --> IStorageProvider
```

---

## 5. Monorepo Package Dependency Graph

```mermaid
graph TD
    apps_web["apps/web (Next.js 15)"]
    apps_api["apps/api (Hono API)"]

    pkg_types["packages/types"]
    pkg_config["packages/config"]
    pkg_utils["packages/utils"]
    pkg_events["packages/events"]
    pkg_storage["packages/storage"]
    pkg_queue["packages/queue"]
    pkg_downloader["packages/downloader"]
    pkg_platform["packages/platform"]
    pkg_cache["packages/cache"]
    pkg_metrics["packages/metrics"]
    pkg_telemetry["packages/telemetry"]

    apps_web --> pkg_types
    apps_web --> pkg_utils
    
    apps_api --> pkg_platform
    apps_api --> pkg_queue
    apps_api --> pkg_storage
    apps_api --> pkg_downloader
    apps_api --> pkg_cache
    apps_api --> pkg_metrics
    apps_api --> pkg_telemetry
    apps_api --> pkg_events
    apps_api --> pkg_types
    apps_api --> pkg_config
    apps_api --> pkg_utils

    pkg_downloader --> pkg_events
    pkg_downloader --> pkg_types
    pkg_downloader --> pkg_utils
    pkg_queue --> pkg_events
    pkg_storage --> pkg_types
    pkg_platform --> pkg_types
```
