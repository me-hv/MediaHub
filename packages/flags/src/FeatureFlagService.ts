export type FeatureFlagName =
  | 'ENABLE_STRIPE'
  | 'ENABLE_ORGANIZATIONS'
  | 'ENABLE_OUTBOX'
  | 'ENABLE_WORKER_AUTOSCALING'
  | 'ENABLE_FEATURE_FLAGS';

export class FeatureFlagService {
  private static flags: Map<FeatureFlagName, boolean> = new Map([
    ['ENABLE_STRIPE', true],
    ['ENABLE_ORGANIZATIONS', true],
    ['ENABLE_OUTBOX', true],
    ['ENABLE_WORKER_AUTOSCALING', true],
    ['ENABLE_FEATURE_FLAGS', true],
  ]);

  static isEnabled(flag: FeatureFlagName): boolean {
    return this.flags.get(flag) ?? false;
  }

  static setFlag(flag: FeatureFlagName, enabled: boolean): void {
    this.flags.set(flag, enabled);
  }

  static getAllFlags(): Record<string, boolean> {
    const res: Record<string, boolean> = {};
    this.flags.forEach((v, k) => {
      res[k] = v;
    });
    return res;
  }
}
