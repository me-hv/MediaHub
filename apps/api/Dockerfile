FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mediahub/api run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache python3 py3-pip ffmpeg && \
    pip install --no-cache-dir yt-dlp

COPY --from=builder /app ./

EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
