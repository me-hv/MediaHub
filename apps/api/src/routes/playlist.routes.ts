import { Hono } from 'hono';
import { PlaylistController } from '../controllers/playlist.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import type { AppEnv } from '../app';

export const playlistRoutes = new Hono<AppEnv>();

playlistRoutes.post('/playlist/analyze', authMiddleware(false), PlaylistController.analyzePlaylist);
