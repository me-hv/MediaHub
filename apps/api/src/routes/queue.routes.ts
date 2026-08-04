import { Hono } from 'hono';
import { QueueController } from '../controllers/queue.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import type { AppEnv } from '../app';

export const queueRoutes = new Hono<AppEnv>();

queueRoutes.post('/batch/analyze', authMiddleware(false), QueueController.analyzeBatch);
queueRoutes.post('/batch/download', authMiddleware(false), QueueController.enqueueBatch);
queueRoutes.get('/progress/stream', authMiddleware(false), QueueController.streamProgress);
