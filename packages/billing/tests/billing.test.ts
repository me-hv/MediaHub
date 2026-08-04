import { describe, it, expect } from 'vitest';
import { PlanResolver, StripeService } from '../src';

describe('PlanResolver & StripeService', () => {
  it('should resolve correct plan limits for PRO and ENTERPRISE', () => {
    const pro = PlanResolver.getPlan('PRO');
    expect(pro.monthlyDownloadsLimit).toBe(10000);
    expect(pro.maxProjects).toBe(5);

    const enterprise = PlanResolver.getPlan('ENTERPRISE');
    expect(enterprise.monthlyDownloadsLimit).toBe(1000000);
  });

  it('should generate valid Stripe checkout URLs', async () => {
    const session = await StripeService.createCheckoutSession('org-123', 'PRO', 'http://localhost:3000');
    expect(session.url).toContain('checkout.stripe.com');
    expect(session.sessionId).toContain('cs_test_');
  });
});
