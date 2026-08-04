export class RedlockHelper {
  private static activeLocks = new Set<string>();

  static async acquireLock(resourceKey: string, ttlMs = 10000): Promise<boolean> {
    if (this.activeLocks.has(resourceKey)) {
      return false;
    }
    this.activeLocks.add(resourceKey);
    setTimeout(() => {
      this.activeLocks.delete(resourceKey);
    }, ttlMs);
    return true;
  }

  static async releaseLock(resourceKey: string): Promise<void> {
    this.activeLocks.delete(resourceKey);
  }
}
