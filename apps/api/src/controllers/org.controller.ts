import { Context } from 'hono';
import { OrganizationService } from '../services/org.service';
import { ProjectService } from '../services/project.service';
import { BillingService } from '../services/billing.service';
import { StripeService } from '@mediahub/billing';
import type { AppEnv } from '../app';

export class OrganizationController {
  static async createOrganization(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();

    const name = body?.name;
    if (!name || name.trim().length === 0) {
      return c.json({ success: false, code: 'INVALID_NAME', message: 'Organization name required.', timestamp: new Date().toISOString(), requestId }, 400);
    }

    const org = await OrganizationService.createOrganization(user.id, name);
    return c.json({ success: true, data: { organization: org }, timestamp: new Date().toISOString(), requestId });
  }

  static async listUserOrganizations(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const orgs = await OrganizationService.listUserOrganizations(user.id);
    return c.json({ success: true, data: { organizations: orgs }, timestamp: new Date().toISOString(), requestId });
  }

  static async getMembers(c: Context<AppEnv>) {
    const org = (c as any).get('org');
    const requestId = c.get('requestId') || 'req-unknown';

    if (!org) {
      return c.json({ success: false, code: 'ORG_NOT_FOUND', message: 'Organization context missing', timestamp: new Date().toISOString(), requestId }, 404);
    }

    const members = await OrganizationService.getOrganizationMembers(org.id);
    return c.json({ success: true, data: { members }, timestamp: new Date().toISOString(), requestId });
  }

  static async inviteMember(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const org = (c as any).get('org');
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();

    const email = body?.email;
    const role = body?.role || 'DEVELOPER';

    if (!email || !email.includes('@')) {
      return c.json({ success: false, code: 'INVALID_EMAIL', message: 'Valid email address required.', timestamp: new Date().toISOString(), requestId }, 400);
    }

    const invitation = await OrganizationService.inviteMember(org.id, user.id, email, role);
    return c.json({ success: true, data: { invitation }, timestamp: new Date().toISOString(), requestId });
  }

  static async createProject(c: Context<AppEnv>) {
    const org = (c as any).get('org');
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();

    const name = body?.name;
    const environment = body?.environment || 'PRODUCTION';

    if (!name || name.trim().length === 0) {
      return c.json({ success: false, code: 'INVALID_NAME', message: 'Project name required.', timestamp: new Date().toISOString(), requestId }, 400);
    }

    const project = await ProjectService.createProject(org.id, name, environment);
    return c.json({ success: true, data: { project }, timestamp: new Date().toISOString(), requestId });
  }

  static async listProjects(c: Context<AppEnv>) {
    const org = (c as any).get('org');
    const requestId = c.get('requestId') || 'req-unknown';

    if (!org) {
      return c.json({ success: false, code: 'ORG_NOT_FOUND', message: 'Organization context missing', timestamp: new Date().toISOString(), requestId }, 404);
    }

    const projects = await ProjectService.listProjects(org.id);
    return c.json({ success: true, data: { projects }, timestamp: new Date().toISOString(), requestId });
  }

  static async getBilling(c: Context<AppEnv>) {
    const org = (c as any).get('org');
    const requestId = c.get('requestId') || 'req-unknown';

    if (!org) {
      return c.json({ success: false, code: 'ORG_NOT_FOUND', message: 'Organization context missing', timestamp: new Date().toISOString(), requestId }, 404);
    }

    const subscription = await BillingService.getSubscription(org.id);
    const invoices = await BillingService.listInvoices(org.id);
    return c.json({ success: true, data: { subscription, invoices }, timestamp: new Date().toISOString(), requestId });
  }

  static async createCheckoutSession(c: Context<AppEnv>) {
    const org = (c as any).get('org');
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();

    const plan = body?.plan || 'PRO';
    const session = await StripeService.createCheckoutSession(org.id, plan, 'http://localhost:3000/orgs/billing');

    return c.json({ success: true, data: { session }, timestamp: new Date().toISOString(), requestId });
  }
}
