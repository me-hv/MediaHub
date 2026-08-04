export interface PlatformDistribution {
  platform: string;
  count: number;
  percentage: number;
}

export class AnalyticsEngine {
  static calculatePlatformDistribution(records: Array<{ platform: string }>): PlatformDistribution[] {
    const counts: Record<string, number> = {};
    let total = 0;

    records.forEach((r) => {
      counts[r.platform] = (counts[r.platform] || 0) + 1;
      total++;
    });

    if (total === 0) return [];

    return Object.entries(counts).map(([platform, count]) => ({
      platform,
      count,
      percentage: Math.round((count / total) * 10000) / 100,
    }));
  }

  static calculateCacheHitRate(hits: number, misses: number): number {
    const total = hits + misses;
    if (total === 0) return 0;
    return Math.round((hits / total) * 10000) / 100;
  }
}
