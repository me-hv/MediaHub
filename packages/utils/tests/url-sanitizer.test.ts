import { describe, it, expect } from 'vitest';
import { sanitizeAndValidateUrl } from '../src/url-sanitizer';

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
