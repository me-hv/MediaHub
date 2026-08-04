import { describe, it, expect } from 'vitest';
import { FeatureFlagService } from '../src/FeatureFlagService';

describe('FeatureFlagService', () => {
  it('should evaluate default feature flags', () => {
    expect(FeatureFlagService.isEnabled('ENABLE_STRIPE')).toBe(true);
    expect(FeatureFlagService.isEnabled('ENABLE_OUTBOX')).toBe(true);
  });

  it('should allow runtime feature flag overrides', () => {
    FeatureFlagService.setFlag('ENABLE_WORKER_AUTOSCALING', false);
    expect(FeatureFlagService.isEnabled('ENABLE_WORKER_AUTOSCALING')).toBe(false);
  });
});
