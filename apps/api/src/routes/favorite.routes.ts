import { Hono } from 'hono';
import { FavoriteController } from '../controllers/favorite.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import type { AppEnv } from '../app';

export const favoriteRoutes = new Hono<AppEnv>();

favoriteRoutes.post('/favorites', authMiddleware(true), FavoriteController.addFavorite);
favoriteRoutes.get('/favorites', authMiddleware(true), FavoriteController.getFavorites);
favoriteRoutes.delete('/favorites/:id', authMiddleware(true), FavoriteController.removeFavorite);
