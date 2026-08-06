import { describe, it, expect } from 'vitest';
import { ProviderFactory } from '../src/factory/ProviderFactory';
import { TwitterNormalizer } from '../src/normalizers/TwitterNormalizer';
import { YouTubeNormalizer } from '../src/normalizers/YouTubeNormalizer';
import { GenericNormalizer } from '../src/normalizers/GenericNormalizer';
import { NormalizerFactory } from '../src/normalizers/NormalizerFactory';

describe('Universal Provider & Normalizer Integration Suite', () => {
  it('should correctly resolve provider instances for all supported URLs', () => {
    expect(ProviderFactory.getProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ').name).toBe('YoutubeProvider');
    expect(ProviderFactory.getProvider('https://music.youtube.com/watch?v=dQw4w9WgXcQ').name).toBe('YouTubeMusicProvider');
    expect(ProviderFactory.getProvider('https://x.com/user/status/123456789').name).toBe('GenericYtDlpProvider');
    expect(ProviderFactory.getProvider('https://www.instagram.com/reel/C1234567/').name).toBe('InstagramProvider');
    expect(ProviderFactory.getProvider('https://www.reddit.com/r/videos/comments/123456/').name).toBe('RedditProvider');
    expect(ProviderFactory.getProvider('https://www.tiktok.com/@user/video/123456789').name).toBe('GenericYtDlpProvider');
  });

  it('should normalize Twitter formats without discarding progressive MP4 streams', () => {
    const rawTwitterFormats = [
      { format_id: 'http-1080', ext: 'mp4', width: 1920, height: 1080, vcodec: 'h264', acodec: 'aac', tbr: 2500 },
      { format_id: 'http-720', ext: 'mp4', width: 1280, height: 720, vcodec: 'h264', acodec: 'aac', tbr: 1500 },
      { format_id: 'http-480', ext: 'mp4', width: 852, height: 480, vcodec: 'h264', acodec: 'aac', tbr: 800 },
    ];

    const result = TwitterNormalizer.prototype.normalize(rawTwitterFormats, { overallDuration: 60 });
    expect(result.video.length).toBe(3);
    expect(result.combined.length).toBe(3);
    expect(result.video[0].resolution).toBe('1920×1080');
    expect(result.video[0].audioIncluded).toBe(true);
    expect(result.video[0].hasAudio).toBe(true);
  });

  it('should normalize YouTube formats with Virtual Merged DASH formats (+bestaudio)', () => {
    const rawYouTubeFormats = [
      { format_id: '137', ext: 'mp4', width: 1920, height: 1080, vcodec: 'avc1', acodec: 'none', tbr: 4000 },
      { format_id: '140', ext: 'm4a', vcodec: 'none', acodec: 'mp4a', abr: 128 },
    ];

    const result = YouTubeNormalizer.prototype.normalize(rawYouTubeFormats, { overallDuration: 180 });
    expect(result.video.length).toBe(1);
    expect(result.video[0].formatId).toBe('137+bestaudio');
    expect(result.video[0].audioIncluded).toBe(true);
    expect(result.video[0].requiresMux).toBe(true);
    expect(result.audio.length).toBeGreaterThan(0);
  });

  it('should normalize Generic platform formats (Instagram, TikTok, Reddit, Facebook)', () => {
    const rawGenericFormats = [
      { format_id: 'dash-hd', ext: 'mp4', width: 1080, height: 1920, vcodec: 'h264', acodec: 'aac', tbr: 3000 },
    ];

    const normalizer = new GenericNormalizer('Instagram');
    const result = normalizer.normalize(rawGenericFormats, { overallDuration: 30 });
    expect(result.video.length).toBe(1);
    expect(result.video[0].audioIncluded).toBe(true);
    expect(result.combined.length).toBe(1);
  });

  it('should route platforms cleanly through NormalizerFactory', () => {
    const twitterRes = NormalizerFactory.normalize('X', [{ format_id: '1', ext: 'mp4', height: 720, vcodec: 'h264', acodec: 'aac' }]);
    expect(twitterRes.video.length).toBe(1);

    const ytRes = NormalizerFactory.normalize('YOUTUBE', [{ format_id: '137', ext: 'mp4', height: 1080, vcodec: 'h264' }]);
    expect(ytRes.video[0].formatId).toBe('137+bestaudio');
  });
});
