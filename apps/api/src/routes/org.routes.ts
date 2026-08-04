import { Hono } from 'hono';
import { OrganizationController } from '../controllers/org.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { orgContextMiddleware, rbacMiddleware } from '../middlewares/org.middleware';
import type { AppEnv } from '../app';

export const orgRoutes = new Hono<AppEnv>();

// Organization Management
orgRoutes.get('/orgs', authMiddleware(true), OrganizationController.listUserOrganizations);
orgRoutes.post('/orgs', authMiddleware(true), OrganizationController.createOrganization);

// Organization Context Scoped Routes
orgRoutes.use('/orgs/:orgSlug/*', authMiddleware(true), orgContextMiddleware());

// Members & Invites
orgRoutes.get('/orgs/:orgSlug/members', rbacMiddleware('media.read'), OrganizationController.getMembers);
orgRoutes.post('/orgs/:orgSlug/invitations', rbacMiddleware('members.manage'), OrganizationController.inviteMember);

// Projects
orgRoutes.get('/orgs/:orgSlug/projects', rbacMiddleware('media.read'), OrganizationController.listProjects);
orgRoutes.post('/orgs/:orgSlug/projects', rbacMiddleware('projects.manage'), OrganizationController.createProject);

// Billing & Stripe
orgRoutes.get('/orgs/:orgSlug/billing', rbacMiddleware('billing.manage'), OrganizationController.getBilling);
orgRoutes.post('/orgs/:orgSlug/billing/checkout', rbacMiddleware('billing.manage'), OrganizationController.createCheckoutSession);
