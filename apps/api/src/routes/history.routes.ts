import { Hono } from 'hono';
import { HistoryController } from '../controllers/history.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import type { AppEnv } from '../app';

export const historyRoutes = new Hono<AppEnv>();

historyRoutes.get('/history', authMiddleware(true), HistoryController.getHistory);
historyRoutes.delete('/history/:id', authMiddleware(true), HistoryController.deleteHistoryItem);
historyRoutes.delete('/history', authMiddleware(true), HistoryController.clearHistory);
