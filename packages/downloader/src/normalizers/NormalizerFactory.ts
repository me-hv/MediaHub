import { PlatformType, CategorizedQualities } from '@mediahub/types';
import { BaseNormalizer } from './BaseNormalizer';
import { TwitterNormalizer } from './TwitterNormalizer';
import { YouTubeNormalizer } from './YouTubeNormalizer';
import { GenericNormalizer } from './GenericNormalizer';
import { YtDlpDumpJsonOutput } from '../yt-dlp/YtDlpWrapper';

export class NormalizerFactory {
  private static twitterNormalizer = new TwitterNormalizer();
  private static youtubeNormalizer = new YouTubeNormalizer();
  private static instagramNormalizer = new GenericNormalizer('Instagram');
  private static tiktokNormalizer = new GenericNormalizer('TikTok');
  private static redditNormalizer = new GenericNormalizer('Reddit');
  private static facebookNormalizer = new GenericNormalizer('Facebook');
  private static defaultNormalizer = new GenericNormalizer('Generic');

  static getNormalizer(platform: PlatformType): BaseNormalizer {
    switch (platform) {
      case 'X':
        return this.twitterNormalizer;
      case 'YOUTUBE':
      case 'YOUTUBE_MUSIC':
        return this.youtubeNormalizer;
      case 'INSTAGRAM':
        return this.instagramNormalizer;
      case 'TIKTOK':
        return this.tiktokNormalizer;
      case 'REDDIT':
        return this.redditNormalizer;
      case 'FACEBOOK':
        return this.facebookNormalizer;
      default:
        return this.defaultNormalizer;
    }
  }

  static normalize(
    platform: PlatformType,
    rawFormats: YtDlpDumpJsonOutput['formats'] = [],
    overallDuration = 180,
    ffmpegAvailable = true
  ): CategorizedQualities {
    const normalizer = this.getNormalizer(platform);
    return normalizer.normalize(rawFormats, { overallDuration, ffmpegAvailable });
  }
}
