export type PlanTier = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  monthlyPriceCents: number;
  monthlyDownloadsLimit: number;
  maxProjects: number;
  maxMembers: number;
  maxConcurrentJobs: number;
  storageLimitBytes: number;
}

export class PlanResolver {
  private static plans: Record<PlanTier, PlanDefinition> = {
    FREE: {
      tier: 'FREE',
      name: 'Developer Free',
      monthlyPriceCents: 0,
      monthlyDownloadsLimit: 500,
      maxProjects: 1,
      maxMembers: 3,
      maxConcurrentJobs: 2,
      storageLimitBytes: 2 * 1024 * 1024 * 1024, // 2 GB
    },
    PRO: {
      tier: 'PRO',
      name: 'Pro Platform',
      monthlyPriceCents: 4900, // $49/mo
      monthlyDownloadsLimit: 10000,
      maxProjects: 5,
      maxMembers: 10,
      maxConcurrentJobs: 10,
      storageLimitBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    },
    BUSINESS: {
      tier: 'BUSINESS',
      name: 'Business Scale',
      monthlyPriceCents: 19900, // $199/mo
      monthlyDownloadsLimit: 100000,
      maxProjects: 25,
      maxMembers: 50,
      maxConcurrentJobs: 25,
      storageLimitBytes: 500 * 1024 * 1024 * 1024, // 500 GB
    },
    ENTERPRISE: {
      tier: 'ENTERPRISE',
      name: 'Enterprise Dedicated',
      monthlyPriceCents: 99900, // $999/mo
      monthlyDownloadsLimit: 1000000,
      maxProjects: 999,
      maxMembers: 999,
      maxConcurrentJobs: 100,
      storageLimitBytes: 10 * 1024 * 1024 * 1024 * 1024, // 10 TB
    },
  };

  static getPlan(tier: PlanTier = 'FREE'): PlanDefinition {
    return this.plans[tier] || this.plans.FREE;
  }
}
