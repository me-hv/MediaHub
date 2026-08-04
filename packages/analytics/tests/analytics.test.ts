import { describe, it, expect } from 'vitest';
import { AnalyticsEngine } from '../src/AnalyticsEngine';

describe('AnalyticsEngine', () => {
  it('should calculate platform percentage distribution', () => {
    const data = [
      { platform: 'YOUTUBE' },
      { platform: 'YOUTUBE' },
      { platform: 'TIKTOK' },
      { platform: 'INSTAGRAM' },
    ];

    const res = AnalyticsEngine.calculatePlatformDistribution(data);
    const yt = res.find((r) => r.platform === 'YOUTUBE');
    expect(yt?.percentage).toBe(50);
  });

  it('should compute cache hit rate percentage', () => {
    const rate = AnalyticsEngine.calculateCacheHitRate(80, 20);
    expect(rate).toBe(80);
  });
});
