import { Hono } from 'hono';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import type { AppEnv } from '../app';

export const userRoutes = new Hono<AppEnv>();

userRoutes.get('/user/settings', authMiddleware(true), UserController.getSettings);
userRoutes.put('/user/settings', authMiddleware(true), UserController.updateSettings);
userRoutes.get('/dashboard/stats', authMiddleware(true), UserController.getDashboardStats);
