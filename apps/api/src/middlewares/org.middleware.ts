import { Context, Next } from 'hono';
import { prisma } from '../config/prisma';
import { RBACEngine, PermissionAction, OrganizationRole } from '@mediahub/rbac';
import type { AppEnv } from '../app';

export function orgContextMiddleware() {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user');
    const orgHeader = c.req.header('x-organization-id');
    const orgParam = c.req.param('orgSlug') || c.req.param('orgId');

    if (user) {
      try {
        const membership = await prisma.membership.findFirst({
          where: {
            userId: user.id,
            OR: [
              { organizationId: orgHeader || undefined },
              { organization: { slug: orgParam || undefined } },
            ],
          },
          include: { organization: true },
        });

        if (membership) {
          (c as any).set('org', membership.organization);
          (c as any).set('membership', membership);
        }
      } catch {}
    }

    await next();
  };
}

export function rbacMiddleware(action: PermissionAction) {
  return async (c: Context<AppEnv>, next: Next) => {
    const membership = (c as any).get('membership');

    if (!membership) {
      return c.json(
        {
          success: false,
          code: 'FORBIDDEN_ORG',
          message: 'Active Organization membership required.',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId') || 'req-unknown',
        },
        403
      );
    }

    const hasAccess = RBACEngine.hasPermission(membership.role as OrganizationRole, action);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          code: 'FORBIDDEN_ROLE',
          message: `Role '${membership.role}' lacks permission for action '${action}'.`,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId') || 'req-unknown',
        },
        403
      );
    }

    await next();
  };
}
