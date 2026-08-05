import { Hono } from 'hono';
import { MediaController } from '../controllers/media.controller';
import { createRateLimiter } from '../middlewares/rate-limit.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import type { AppEnv } from '../app';

export const mediaRoutes = new Hono<AppEnv>();

const analyzeRateLimiter = createRateLimiter(20, 60000);
const downloadRateLimiter = createRateLimiter(10, 60000);

mediaRoutes.post('/analyze', analyzeRateLimiter, authMiddleware(false), MediaController.analyzeMedia);
mediaRoutes.post('/media/analyze', analyzeRateLimiter, authMiddleware(false), MediaController.analyzeMedia);

mediaRoutes.post('/download', downloadRateLimiter, authMiddleware(false), MediaController.downloadMedia);
mediaRoutes.post('/media/download', downloadRateLimiter, authMiddleware(false), MediaController.downloadMedia);

mediaRoutes.post('/media/subtitles', authMiddleware(false), MediaController.getSubtitles);
mediaRoutes.post('/media/audio', authMiddleware(false), MediaController.extractAudio);
