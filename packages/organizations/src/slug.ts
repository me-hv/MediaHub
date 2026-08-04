const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'billing',
  'settings',
  'support',
  'developer',
  'login',
  'register',
  'dashboard',
  'app',
]);

export class SlugUtils {
  static generateSlug(name: string): string {
    const raw = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const candidate = raw || 'org';
    if (RESERVED_SLUGS.has(candidate)) {
      return `${candidate}-team`;
    }
    return candidate;
  }

  static isReserved(slug: string): boolean {
    return RESERVED_SLUGS.has(slug.toLowerCase().trim());
  }
}
