import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import type { AppEnv } from '../app';

export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/auth/sync', authMiddleware(true), AuthController.syncUser);
