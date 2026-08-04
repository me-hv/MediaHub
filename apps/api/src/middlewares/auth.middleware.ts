import { Context, Next } from 'hono';
import { UserService } from '../services/user.service';
import type { AppEnv } from '../app';

export interface UserPayload {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export function authMiddleware(required = false) {
  return async (c: Context<AppEnv>, next: Next) => {
    const authHeader = c.req.header('authorization');
    const mockUserId = c.req.header('x-mock-user-id');

    let user: UserPayload | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      user = {
        id: `usr_${token.slice(0, 10)}`,
        email: 'authenticated.user@mediahub.io',
        displayName: 'Verified MediaHub User',
      };
    } else if (mockUserId) {
      user = {
        id: mockUserId,
        email: `mock.${mockUserId}@mediahub.io`,
        displayName: `Mock User (${mockUserId})`,
      };
    }

    if (user) {
      c.set('user', user);
      await UserService.syncUser(user.id, user.email, user.displayName, user.photoURL);
    }

    if (required && !user) {
      return c.json(
        {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access this endpoint.',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId') || 'req-unknown',
        },
        401
      );
    }

    await next();
  };
}
