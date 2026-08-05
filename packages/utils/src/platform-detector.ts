import { PlatformType } from '@mediahub/types';

export function detectPlatform(url: string): PlatformType {
  if (!url || typeof url !== 'string') return 'UNKNOWN';

  let cleanUrl = url.trim().toLowerCase();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    const parsed = new URL(cleanUrl);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes('music.youtube.com')) {
      return 'YOUTUBE_MUSIC';
    }
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'YOUTUBE';
    }
    if (hostname.includes('instagram.com') || hostname.includes('instagr.am')) {
      return 'INSTAGRAM';
    }
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'X';
    }
    if (hostname.includes('reddit.com') || hostname.includes('redd.it')) {
      return 'REDDIT';
    }
    if (hostname.includes('tiktok.com')) {
      return 'TIKTOK';
    }
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch') || hostname.includes('fb.com')) {
      return 'FACEBOOK';
    }
    if (hostname.includes('vimeo.com')) {
      return 'VIMEO';
    }
    if (hostname.includes('threads.net')) {
      return 'THREADS';
    }
    if (hostname.includes('pinterest.com') || hostname.includes('pin.it')) {
      return 'PINTEREST';
    }

    return 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}
