import { PlanResolver, PlanTier } from '@mediahub/billing';

export interface CurrentUsage {
  downloadsThisMonth: number;
  projectsCount: number;
  membersCount: number;
}

export class QuotaService {
  static checkDownloadQuota(planTier: PlanTier, currentDownloads: number): { allowed: boolean; limit: number } {
    const plan = PlanResolver.getPlan(planTier);
    return {
      allowed: currentDownloads < plan.monthlyDownloadsLimit,
      limit: plan.monthlyDownloadsLimit,
    };
  }

  static checkProjectLimit(planTier: PlanTier, currentProjects: number): { allowed: boolean; limit: number } {
    const plan = PlanResolver.getPlan(planTier);
    return {
      allowed: currentProjects < plan.maxProjects,
      limit: plan.maxProjects,
    };
  }

  static checkMemberLimit(planTier: PlanTier, currentMembers: number): { allowed: boolean; limit: number } {
    const plan = PlanResolver.getPlan(planTier);
    return {
      allowed: currentMembers < plan.maxMembers,
      limit: plan.maxMembers,
    };
  }
}
