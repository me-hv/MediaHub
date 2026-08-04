import { Hono } from 'hono';
import { PublicController } from '../controllers/public.controller';
import { apiKeyMiddleware, scopeMiddleware, idempotencyMiddleware } from '../middlewares/api-key.middleware';
import type { AppEnv } from '../app';

export const publicRoutes = new Hono<AppEnv>();

// Public Introspection Endpoint
publicRoutes.get('/public/me', apiKeyMiddleware(), PublicController.getMe);

// Public Media Operations
publicRoutes.post(
  '/public/analyze',
  apiKeyMiddleware(),
  scopeMiddleware('media.read'),
  PublicController.getMe
);

publicRoutes.post(
  '/public/download',
  apiKeyMiddleware(),
  scopeMiddleware('media.download'),
  idempotencyMiddleware(),
  PublicController.getMe
);

publicRoutes.post(
  '/public/playlist/analyze',
  apiKeyMiddleware(),
  scopeMiddleware('playlist.read'),
  PublicController.getMe
);

// Public History & Favorites
publicRoutes.get('/public/history', apiKeyMiddleware(), scopeMiddleware('history.read'), PublicController.getMe);
publicRoutes.get('/public/favorites', apiKeyMiddleware(), scopeMiddleware('favorites.read'), PublicController.getMe);

// Public API Key & Webhook Management
publicRoutes.get('/public/keys', apiKeyMiddleware(), scopeMiddleware('admin'), PublicController.listApiKeys);
publicRoutes.post('/public/keys', apiKeyMiddleware(), scopeMiddleware('admin'), PublicController.createApiKey);
publicRoutes.delete('/public/keys/:id', apiKeyMiddleware(), scopeMiddleware('admin'), PublicController.revokeApiKey);

publicRoutes.get('/public/webhooks', apiKeyMiddleware(), scopeMiddleware('admin'), PublicController.listWebhooks);
publicRoutes.post('/public/webhooks', apiKeyMiddleware(), scopeMiddleware('admin'), PublicController.createWebhook);
publicRoutes.delete('/public/webhooks/:id', apiKeyMiddleware(), scopeMiddleware('admin'), PublicController.deleteWebhook);
