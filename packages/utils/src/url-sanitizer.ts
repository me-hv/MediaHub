import { z } from 'zod';

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'igshid',
  'igsh',
  'si',
  'feature',
  'app',
  'fbclid',
  'ref',
  's',
  'cxt',
  't',
  'gclid',
  'msclkid',
]);

export function normalizeMediaUrl(inputUrl: string): string {
  if (!inputUrl || typeof inputUrl !== 'string') return inputUrl;

  let urlStr = inputUrl.trim();
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    urlStr = `https://${urlStr}`;
  }

  try {
    const parsed = new URL(urlStr);
    let hostname = parsed.hostname.toLowerCase();

    // 1. Hostname Normalization
    if (hostname === 'old.reddit.com' || hostname === 'm.reddit.com') {
      hostname = 'www.reddit.com';
    } else if (hostname === 'instagr.am' || hostname === 'instagram.com') {
      hostname = 'www.instagram.com';
    } else if (hostname === 'twitter.com') {
      hostname = 'x.com';
    }

    parsed.hostname = hostname;

    // 2. Strip tracking query parameters
    const searchParams = new URLSearchParams(parsed.search);
    for (const key of Array.from(searchParams.keys())) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        searchParams.delete(key);
      }
    }
    parsed.search = searchParams.toString();

    return parsed.toString();
  } catch {
    return inputUrl;
  }
}

// SSRF & Invalid Host Checker
function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  // IPv4 Private Range Check
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = host.match(ipv4Regex);
  if (match) {
    const [, oct1, oct2] = match.map(Number);
    // 10.0.0.0/8
    if (oct1 === 10) return true;
    // 172.16.0.0/12
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) return true;
    // 192.168.0.0/16
    if (oct1 === 192 && oct2 === 168) return true;
    // 169.254.0.0/16 (Link Local / Cloud Metadata API)
    if (oct1 === 169 && oct2 === 254) return true;
    // Loopback 127.0.0.0/8
    if (oct1 === 127) return true;
  }

  return false;
}

export const urlSchema = z.string().trim().superRefine((val, ctx) => {
  if (!val) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please paste a valid media URL',
    });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(val);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid URL format. Example: https://youtube.com/watch?v=...',
    });
    return;
  }

  if (parsed.protocol !== 'https:') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only secure HTTPS media URLs are supported.',
    });
    return;
  }

  if (isPrivateHost(parsed.hostname)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Access to private or local network URLs is prohibited.',
    });
    return;
  }
});

// Simple cross-platform string hash for safe client/server compilation
function computeStringHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

export function sanitizeAndValidateUrl(inputUrl: string): { success: true; url: string; hash: string } | { success: false; error: string } {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { success: false, error: 'Please paste a valid media URL' };
  }

  const normalized = normalizeMediaUrl(inputUrl);

  const result = urlSchema.safeParse(normalized);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || 'Invalid media URL',
    };
  }

  const url = result.data;
  const hash = computeStringHash(url);

  return {
    success: true,
    url,
    hash,
  };
}
