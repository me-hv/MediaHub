import { Hono } from 'hono';
import { AudioController } from '../controllers/audio.controller';
import { createRateLimiter } from '../middlewares/rate-limit.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import type { AppEnv } from '../app';

export const audioRoutes = new Hono<AppEnv>();

const analyzeRateLimiter = createRateLimiter(20, 60000);
const downloadRateLimiter = createRateLimiter(10, 60000);

audioRoutes.post('/audio/analyze', analyzeRateLimiter, authMiddleware(false), AudioController.analyzeAudio);
audioRoutes.post('/audio/download', downloadRateLimiter, authMiddleware(false), AudioController.downloadAudio);
audioRoutes.post('/audio/album', analyzeRateLimiter, authMiddleware(false), AudioController.getAlbumDetails);
