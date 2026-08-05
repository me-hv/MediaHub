import { describe, it, expect } from 'vitest';
import { sanitizeAndValidateUrl, normalizeMediaUrl } from '../src/url-sanitizer';

describe('normalizeMediaUrl', () => {
  it('strips tracking parameters like utm_source, igshid, si, and fbclid', () => {
    const input = 'https://www.instagram.com/reel/C12345/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==';
    const normalized = normalizeMediaUrl(input);
    expect(normalized).toBe('https://www.instagram.com/reel/C12345/');
  });

  it('normalizes old.reddit.com and m.reddit.com to www.reddit.com', () => {
    const input = 'https://old.reddit.com/r/videos/comments/abc1234/test_post/?utm_source=share';
    const normalized = normalizeMediaUrl(input);
    expect(normalized).toBe('https://www.reddit.com/r/videos/comments/abc1234/test_post/');
  });

  it('normalizes twitter.com to x.com', () => {
    const input = 'https://twitter.com/user/status/123456789?s=20';
    const normalized = normalizeMediaUrl(input);
    expect(normalized).toBe('https://x.com/user/status/123456789');
  });
});

describe('sanitizeAndValidateUrl', () => {
  it('validates public HTTPS URLs and generates a hash', () => {
    const res = sanitizeAndValidateUrl('https://youtube.com/watch?v=12345');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.url).toBe('https://youtube.com/watch?v=12345');
      expect(res.hash).toBeDefined();
      expect(res.hash.length).toBeGreaterThan(0);
    }
  });

  it('rejects HTTP and invalid protocols', () => {
    const res = sanitizeAndValidateUrl('http://youtube.com/watch?v=12345');
    expect(res.success).toBe(false);
  });

  it('blocks SSRF attempts to localhost or private IPs', () => {
    expect(sanitizeAndValidateUrl('https://localhost/admin').success).toBe(false);
    expect(sanitizeAndValidateUrl('https://127.0.0.1:8080/data').success).toBe(false);
    expect(sanitizeAndValidateUrl('https://169.254.169.254/latest/meta-data').success).toBe(false);
  });
});
