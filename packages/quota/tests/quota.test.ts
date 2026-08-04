import { describe, it, expect } from 'vitest';
import { QuotaService } from '../src/QuotaService';

describe('QuotaService', () => {
  it('should enforce FREE plan download limits', () => {
    const under = QuotaService.checkDownloadQuota('FREE', 100);
    expect(under.allowed).toBe(true);
    expect(under.limit).toBe(500);

    const over = QuotaService.checkDownloadQuota('FREE', 500);
    expect(over.allowed).toBe(false);
  });

  it('should enforce PRO plan project limits', () => {
    const under = QuotaService.checkProjectLimit('PRO', 4);
    expect(under.allowed).toBe(true);
    expect(under.limit).toBe(5);

    const over = QuotaService.checkProjectLimit('PRO', 5);
    expect(over.allowed).toBe(false);
  });

  it('should allow high limits for ENTERPRISE plan', () => {
    const enterprise = QuotaService.checkDownloadQuota('ENTERPRISE', 950000);
    expect(enterprise.allowed).toBe(true);
    expect(enterprise.limit).toBe(1000000);
  });
});
