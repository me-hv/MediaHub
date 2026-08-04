# MediaHub System Architecture Overview

This document provides a high-level overview of the **MediaHub Distributed Platform Architecture**.

---

## 🔀 Workflow Task Sequence Diagram

The download pipeline is orchestrated using `packages/workflows` as a sequence of discrete, retryable `WorkflowTask` instances.

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant API as Hono API Gateway
    participant DB as PostgreSQL DB
    participant Outbox as Outbox Service
    participant Queue as Redis Queue
    participant Worker as Background Worker
    participant EventBus as Domain Event Bus
    participant Storage as Cloud Storage (R2/S3)

    Client->>API: POST /api/v1/media/download
    API->>DB: Begin Transaction (Save Download & Outbox Record)
    DB-->>API: Commit Transaction
    API->>Queue: Push Download Job to Queue
    API-->>Client: 202 Accepted { jobId }

    Queue->>Worker: Pull Next Download Job
    Worker->>Worker: Execute Workflow Tasks (Analyze -> Cache -> Provider -> Download)
    Worker->>Storage: Upload File Artifact
    Worker->>Outbox: Record Outbox Event (DownloadCompleted)
    Outbox->>EventBus: Dispatch Event to Event Bus

    par Asynchronous Side Effects
        EventBus->>Worker: Analytics Worker (Update Usage Counter)
        EventBus->>Worker: Webhook Worker (Send Webhook Payload)
        EventBus->>Worker: Notification Engine (Email / Slack Alert)
    end
```

---

## 🔄 Workflow Task State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> PENDING: Job Enqueued
    PENDING --> ANALYZING: Worker Picks Up Job
    ANALYZING --> CACHE_CHECK: URL Metadata Extracted
    CACHE_CHECK --> DOWNLOADING: Cache Miss
    CACHE_CHECK --> COMPLETED: Cache Hit (Instant Resolve)
    DOWNLOADING --> UPLOADING_STORAGE: Media Downloaded
    UPLOADING_STORAGE --> RECORDING_HISTORY: File Stored in R2/S3
    RECORDING_HISTORY --> DISPATCHING_OUTBOX: Database Log Saved
    DISPATCHING_OUTBOX --> COMPLETED: Outbox Event Dispatched
    
    ANALYZING --> FAILED: Invalid URL / SSRF Shield Triggered
    DOWNLOADING --> FAILED: Network Timeout / Provider Error
    UPLOADING_STORAGE --> FAILED: Storage Credentials Error
    
    FAILED --> ROLLBACK: Trigger Task Rollback Handlers
    ROLLBACK --> DEAD_LETTER_QUEUE: Reached Max Retries
```
