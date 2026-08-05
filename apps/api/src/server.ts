import { serve } from '@hono/node-server';
import { app } from './app';
import { env } from '@mediahub/config';
import { logger } from './utils/logger';
import { globalShutdownManager } from '@mediahub/platform';
import { prisma } from './config/prisma';
import { ExecutableValidator } from '@mediahub/downloader';

// Run binary dependency validation on startup
ExecutableValidator.validateStartup().catch((err) => {
  logger.warn({ error: err.message }, 'Executable validation warning');
});

const server = serve({
  fetch: app.fetch,
  hostname: '0.0.0.0',
  port: env.PORT,
});

logger.info({ port: env.PORT, env: env.NODE_ENV }, '🚀 MediaHub API Server initialized (Phase 3)');

globalShutdownManager.register('Hono HTTP Server', async () => {
  server.close();
});

globalShutdownManager.register('PostgreSQL Prisma Pool', async () => {
  await prisma.$disconnect();
});

globalShutdownManager.setupSignalListeners();
