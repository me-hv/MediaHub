# MediaHub Commercial SaaS Platform Guide

Welcome to the **MediaHub Commercial SaaS Platform** documentation.

MediaHub enables enterprise organizations to manage multi-tenant environments, isolated projects, team memberships, RBAC permissions, Stripe billing subscriptions, and pre-aggregated usage quotas.

---

## 1. Hierarchy & Tenancy Model

```text
Organization (Tenancy Boundary)
├── Subscriptions & Invoices (Stripe)
├── Memberships & Invitations (RBAC: OWNER > ADMIN > DEVELOPER > VIEWER)
└── Projects (Resource Boundary)
    ├── ApiKeys (LIVE / TEST Environments)
    ├── ServiceAccounts (Machine-to-Machine Credentials)
    ├── WebhookConfigs (HMAC Signatures)
    └── DownloadHistory & QueueJobs
```

---

## 2. Role-Based Access Control (RBAC)

- **`OWNER`**: Full administrative access (Org deletion, ownership transfer, billing management, project deletion, member management).
- **`ADMIN`**: Project management, team member invitations, API key revocation, webhook configuration.
- **`DEVELOPER`**: API key generation, webhook configuration, media analysis, media download, job queueing.
- **`VIEWER`**: Read-only access to dashboard, history, analytics, and projects.

---

## 3. Stripe Subscription Plans & Limits

| Plan Tier | Price / mo | Monthly Downloads | Max Projects | Max Members | Max Concurrent Jobs | Storage Limit |
|---|---|---|---|---|---|---|
| **FREE** | $0 | 500 | 1 | 3 | 2 | 2 GB |
| **PRO** | $49 | 10,000 | 5 | 10 | 10 | 50 GB |
| **BUSINESS** | $199 | 100,000 | 25 | 50 | 25 | 500 GB |
| **ENTERPRISE** | $999 | 1,000,000 | 999 | 999 | 100 | 10 TB |

---

## 4. REST API Endpoints (`/api/v1/orgs/`)

### List User Organizations
```http
GET /api/v1/orgs
Authorization: Bearer <token>
```

### Create Organization
```http
POST /api/v1/orgs
Content-Type: application/json

{
  "name": "Acme Media Corp"
}
```

### List Projects
```http
GET /api/v1/orgs/:orgSlug/projects
```

### Invite Member
```http
POST /api/v1/orgs/:orgSlug/invitations
Content-Type: application/json

{
  "email": "engineer@acme.com",
  "role": "DEVELOPER"
}
```

---

## 5. TypeScript SDK (`@mediahub/sdk`) Usage

```typescript
import { MediaHubClient } from '@mediahub/sdk';

const client = new MediaHubClient({
  apiKey: process.env.MEDIAHUB_API_KEY!,
});

// List organizations
const orgs = await client.orgs.list();

// Create project under org
const project = await client.projects.create('acme-media', 'Staging Microservice', 'STAGING');
```
