import { describe, it, expect } from 'vitest';
import { SlugUtils } from '../src/slug';

describe('SlugUtils', () => {
  it('should generate clean URL slug', () => {
    expect(SlugUtils.generateSlug('Acme Media Corp')).toBe('acme-media-corp');
  });

  it('should redirect reserved slugs', () => {
    expect(SlugUtils.generateSlug('admin')).toBe('admin-team');
    expect(SlugUtils.generateSlug('billing')).toBe('billing-team');
  });
});
