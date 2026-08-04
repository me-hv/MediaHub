import { describe, it, expect } from 'vitest';
import { PlatformProbes, getSecurityHeaders } from '../src';

describe('PlatformProbes & Security', () => {
  it('should return valid liveness probe status', () => {
    const live = PlatformProbes.getLiveness();
    expect(live.status).toBe('alive');
    expect(live.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should return production security headers', () => {
    const headers = getSecurityHeaders();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
  });
});
