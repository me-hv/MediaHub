# MediaHub - Universal Media Downloader (Phase 1)

MediaHub is a high-performance, modular, universal media downloader engine designed for enterprise scalability.

Built with **Next.js 15 App Router**, **React 19**, **Hono REST API**, **TypeScript**, **Prisma ORM**, **TailwindCSS**, and a decoupled **Provider/Factory Downloader Engine** (`yt-dlp`).

---

## Features

- **Universal Support**: Download videos & audio from YouTube, Instagram, X (Twitter), Reddit, TikTok, Facebook, Vimeo, Threads, Pinterest, and generic platforms.
- **Auto-Analyze on Paste**: Instantly detects and analyzes media links as soon as a valid HTTPS URL is pasted.
- **Provider & Factory Downloader Architecture**: Decoupled engine (`packages/downloader`) supporting custom platform providers with fallback to generic `yt-dlp`.
- **Hono REST API Engine**: High-performance Node.js API with sliding-window IP rate limiting, Pino structured logging, and automatic `x-request-id` tracing.
- **SSRF & Security Shield**: Strict Zod validation blocking private networks (`localhost`, `127.0.0.1`, RFC1918 IPs, AWS metadata endpoints `169.254.169.254`).
- **Lean PostgreSQL Caching**: Indexed SHA-256 URL hash lookup with 6-hour TTL + in-memory fallback.
- **Stream Directing & Abort Handling**: Direct binary streaming to browser with real-time `AbortController` cancellation.
- **Glassmorphic Dark Theme**: Sleek Linear/Vercel-inspired UI with custom CSS design tokens (`--background`, `--card`, `--accent`, `--border`).

---

## Monorepo Architecture

```text
MediaHub/
├── apps/
│   ├── web/           # Next.js 15 App Router Frontend (Port 3000)
│   └── api/           # Hono REST API Engine (Port 4000)
├── packages/
│   ├── downloader/    # Decoupled Downloader Provider Engine (IDownloaderProvider, ProviderFactory, YtDlpWrapper)
│   ├── config/        # Environment Variable Zod Validation
│   ├── types/         # Shared TypeScript DTOs & Domain Interfaces
│   └── utils/         # Platform Detection, SSRF Sanitization, Formatters
├── docker-compose.yml # PostgreSQL Database setup
└── pnpm-workspace.yaml
```

---

## Quick Start & Installation

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **pnpm**: Corepack or npm install
- **yt-dlp**: Available on system PATH (`yt-dlp --version`)
- **PostgreSQL / Docker**: Optional (API includes in-memory fallback if PostgreSQL is not running)

### Installation Commands

```bash
# 1. Install dependencies across monorepo
pnpm install

# 2. Build shared packages and apps
pnpm build

# 3. Run Vitest test suites
pnpm test

# 4. Start Docker PostgreSQL (Optional)
docker-compose up -d

# 5. Push Prisma database schema (Optional)
pnpm db:push

# 6. Start development servers concurrently (Web on :3000, API on :4000)
pnpm dev
```

---

## API Documentation

### 1. Analyze Media URL
`POST /api/analyze`

**Request Payload:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "urlHash": "281691a56a6448408cf8eb47d174a72d73f4e24efd8c19958ee89ebecb631b12",
      "title": "Rick Astley - Never Gonna Give You Up",
      "uploader": "Rick Astley",
      "duration": 212,
      "platform": "youtube",
      "qualities": {
        "combined": [...],
        "video": [...],
        "audio": [...]
      }
    }
  },
  "timestamp": "2026-08-04T11:15:00.000Z",
  "requestId": "req-8f921a42"
}
```

### 2. Download Stream
`POST /api/download`

**Request Payload:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "formatId": "best"
}
```

**Response:**
Returns binary stream with header: `Content-Disposition: attachment; filename="Rick_Astley...mp4"`.

---

## Future Phase Extension Blueprint

MediaHub is architected to seamlessly accommodate future phases:
- **Phase 2 (Auth & History)**: Add `User` & `Session` models to `apps/api/prisma/schema.prisma`.
- **Phase 3 (Queues & Workers)**: Add Redis + BullMQ workers to process heavy video encodings asynchronously.
- **Phase 4 (Cloud Storage)**: Attach AWS S3 / Cloudflare R2 stream handlers into `packages/downloader`.
