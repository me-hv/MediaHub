# MediaHub Developer Platform Guide

Welcome to the **MediaHub Developer Platform** documentation.

MediaHub provides a Developer Platform allowing external services, web applications, and CLI utilities to programmatically extract media metadata, stream binary files, parse playlists, and receive real-time webhook delivery notifications.

---

## 1. Authentication & API Keys

All Public REST API endpoints under `/api/v1/public/` require an active API Key.

### Request Header Authentication
```http
Authorization: Bearer mh_live_a1b2c3d4e5f6...
```
Or:
```http
X-API-Key: mh_live_a1b2c3d4e5f6...
```

### Introspection Endpoint (`GET /api/v1/public/me`)
Verify credentials, active scopes, and quota limits:
```bash
curl -X GET https://api.mediahub.io/v1/public/me \
  -H "Authorization: Bearer mh_live_your_key_here"
```

---

## 2. Granular Scopes

- `media.read`: Analyze media metadata.
- `media.download`: Stream binary media payload.
- `playlist.read`: Extract playlist metadata & video list.
- `history.read`: Inspect download history logs.
- `history.write`: Log custom download records.
- `favorites.read`: Fetch bookmarked media.
- `favorites.write`: Add or remove media bookmarks.
- `admin`: Full administrative access.

---

## 3. Official TypeScript SDK (`@mediahub/sdk`)

### Installation
```bash
npm install @mediahub/sdk
```

### Usage
```typescript
import { MediaHubClient } from '@mediahub/sdk';

const client = new MediaHubClient({
  apiKey: process.env.MEDIAHUB_API_KEY!,
});

// Analyze media
const metadata = await client.media.analyze('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
console.log(metadata.title, metadata.qualities);

// Download media binary blob
const blob = await client.media.download('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'best');
```

---

## 4. MediaHub Terminal CLI (`mediahub`)

### Usage
```bash
# Verify API Key identity
npx mediahub whoami

# Extract media metadata
npx mediahub analyze https://youtube.com/watch?v=dQw4w9WgXcQ

# List developer API keys
npx mediahub apikey list
```

---

## 5. Webhook System & HMAC SHA-256 Signatures

### Supported Webhook Events
- `download.completed`
- `download.failed`
- `playlist.completed`
- `queue.completed`

### Signature Verification
Webhook deliveries include the following security headers:
- `X-MediaHub-Event`: Event name
- `X-MediaHub-Timestamp`: Epoch millisecond string
- `X-MediaHub-Signature`: HMAC SHA-256 hex digest of raw JSON payload using your webhook secret (`whsec_...`)

```javascript
const crypto = require('crypto');

function verifyWebhook(rawBody, signatureHeader, secretKey) {
  const expected = crypto.createHmac('sha256', secretKey).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
}
```
