import { CategorizedQualities, QualityOption } from '@mediahub/types';
import { YtDlpDumpJsonOutput } from '../yt-dlp/YtDlpWrapper';

export interface NormalizerOptions {
  overallDuration?: number;
  ffmpegAvailable?: boolean;
}

export function calculateAspectRatio(w?: number, h?: number): string | undefined {
  if (!w || !h || w <= 0 || h <= 0) return undefined;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(w, h);
  const num = w / divisor;
  const den = h / divisor;
  if (num === 16 && den === 9) return '16:9';
  if (num === 9 && den === 16) return '9:16';
  if (num === 4 && den === 3) return '4:3';
  if (num === 3 && den === 4) return '3:4';
  if (num === 1 && den === 1) return '1:1';
  return `${num}:${den}`;
}

export function calculateEstimatedFilesize(duration?: number, tbr?: number, vbr?: number, abr?: number): number | undefined {
  const bitrate = tbr || (vbr || 0) + (abr || 0);
  if (!duration || duration <= 0 || !bitrate || bitrate <= 0) return undefined;
  return Math.round(((bitrate * 1000) / 8) * duration);
}

export abstract class BaseNormalizer {
  abstract readonly providerName: string;

  abstract normalize(
    rawFormats: YtDlpDumpJsonOutput['formats'],
    options?: NormalizerOptions
  ): CategorizedQualities;

  protected appendConvertedAudioFormats(
    audioOptions: QualityOption[],
    overallDuration = 180
  ): void {
    const convertedSpecs = [
      { id: 'conv-mp3-320', ext: 'mp3', label: 'MP3 320 kbps', bitrate: 320, acodec: 'mp3' },
      { id: 'conv-mp3-256', ext: 'mp3', label: 'MP3 256 kbps', bitrate: 256, acodec: 'mp3' },
      { id: 'conv-mp3-192', ext: 'mp3', label: 'MP3 192 kbps', bitrate: 192, acodec: 'mp3' },
      { id: 'conv-mp3-128', ext: 'mp3', label: 'MP3 128 kbps', bitrate: 128, acodec: 'mp3' },
      { id: 'conv-flac-lossless', ext: 'flac', label: 'FLAC Lossless', bitrate: 800, acodec: 'flac' },
      { id: 'conv-wav-pcm', ext: 'wav', label: 'WAV PCM 16-bit', bitrate: 1411, acodec: 'pcm' },
      { id: 'conv-aac-256', ext: 'm4a', label: 'AAC 256 kbps', bitrate: 256, acodec: 'aac' },
      { id: 'conv-aac-192', ext: 'm4a', label: 'AAC 192 kbps', bitrate: 192, acodec: 'aac' },
      { id: 'conv-aac-128', ext: 'm4a', label: 'AAC 128 kbps', bitrate: 128, acodec: 'aac' },
      { id: 'conv-ogg-vorbis', ext: 'ogg', label: 'OGG Vorbis', bitrate: 192, acodec: 'vorbis' },
    ];

    for (const spec of convertedSpecs) {
      const estimatedSize = Math.round(((spec.bitrate * 1000) / 8) * (overallDuration || 180));
      audioOptions.push({
        formatId: spec.id,
        ext: spec.ext,
        qualityLabel: spec.label,
        hasVideo: false,
        hasAudio: true,
        category: 'audio',
        acodec: spec.acodec,
        tbr: spec.bitrate,
        filesizeEstimated: estimatedSize,
        requiresConversion: true,
        audioIncluded: true,
      });
    }
  }
}
