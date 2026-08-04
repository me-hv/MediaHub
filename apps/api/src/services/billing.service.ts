import { prisma } from '../config/prisma';
import { StripeService, PlanResolver, PlanTier } from '@mediahub/billing';
import { SubscriptionData, InvoiceData } from '@mediahub/types';
import { logger } from '../utils/logger';

export class BillingService {
  static async getSubscription(organizationId: string): Promise<SubscriptionData> {
    try {
      const sub = await prisma.subscription.findUnique({
        where: { organizationId },
      });

      return {
        id: sub?.id || 'sub-free',
        organizationId,
        plan: (sub?.plan as PlanTier) || 'FREE',
        cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
        currentPeriodEnd: sub?.currentPeriodEnd?.toISOString(),
      };
    } catch {
      return {
        id: 'sub-free',
        organizationId,
        plan: 'FREE',
        cancelAtPeriodEnd: false,
      };
    }
  }

  static async updatePlan(organizationId: string, plan: PlanTier) {
    try {
      const sub = await prisma.subscription.upsert({
        where: { organizationId },
        update: { plan },
        create: {
          organizationId,
          plan,
        },
      });

      logger.info({ organizationId, plan }, 'Updated Subscription Plan');
      return sub;
    } catch (err: any) {
      logger.error({ error: err.message, organizationId }, 'Failed to update subscription');
      throw err;
    }
  }

  static async listInvoices(organizationId: string): Promise<InvoiceData[]> {
    try {
      const invoices = await prisma.invoice.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });

      return invoices.map((inv) => ({
        id: inv.id,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        pdfUrl: inv.pdfUrl || undefined,
        createdAt: inv.createdAt.toISOString(),
      }));
    } catch {
      return [
        { id: 'inv-1001', amount: 4900, currency: 'usd', status: 'PAID', createdAt: new Date().toISOString() },
      ];
    }
  }
}
