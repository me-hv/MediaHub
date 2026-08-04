export class RedisCacheService {
  private static store = new Map<string, { value: any; expiresAt: number }>();

  static async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  static async set(key: string, value: any, ttlSeconds = 21600): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  static async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  static async clear(): Promise<void> {
    this.store.clear();
  }
}
