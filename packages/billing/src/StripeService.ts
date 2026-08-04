import { PlanTier } from './PlanResolver';

export class StripeService {
  static async createCheckoutSession(organizationId: string, plan: PlanTier, returnUrl: string) {
    return {
      sessionId: `cs_test_${Date.now()}_${organizationId}`,
      url: `https://checkout.stripe.com/pay/cs_test_${organizationId}?plan=${plan}&return=${encodeURIComponent(returnUrl)}`,
    };
  }

  static async createPortalSession(organizationId: string, returnUrl: string) {
    return {
      url: `https://billing.stripe.com/p/session/test_${organizationId}?return=${encodeURIComponent(returnUrl)}`,
    };
  }
}
