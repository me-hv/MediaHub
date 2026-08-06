import { CategorizedQualities, QualityOption } from '@mediahub/types';
import { BaseNormalizer, NormalizerOptions, calculateAspectRatio, calculateEstimatedFilesize } from './BaseNormalizer';
import { YtDlpDumpJsonOutput } from '../yt-dlp/YtDlpWrapper';

export class TwitterNormalizer extends BaseNormalizer {
  readonly providerName = 'X (Twitter)';

  normalize(
    rawFormats: YtDlpDumpJsonOutput['formats'] = [],
    options: NormalizerOptions = {}
  ): CategorizedQualities {
    const { overallDuration = 180, ffmpegAvailable = true } = options;

    const videoMap = new Map<string, QualityOption>();
    const audioOptions: QualityOption[] = [];
    const combinedOptions: QualityOption[] = [];

    let acceptedCount = 0;
    let rejectedCount = 0;
    const rejectionReasons: string[] = [];

    for (const fmt of rawFormats || []) {
      if (!fmt.format_id) {
        rejectedCount++;
        rejectionReasons.push('missing format_id');
        continue;
      }

      const hasVideo = !!(fmt.vcodec && fmt.vcodec !== 'none') || !!(fmt.height && fmt.height > 0);
      const hasAudio = !!(fmt.acodec && fmt.acodec !== 'none');

      if (!hasVideo && !hasAudio) {
        rejectedCount++;
        rejectionReasons.push(`format_id ${fmt.format_id}: no video or audio stream detected`);
        continue;
      }

      const resolution = fmt.resolution || (fmt.width && fmt.height ? `${fmt.width}×${fmt.height}` : fmt.height ? `${fmt.height}p` : undefined);
      const filesize = fmt.filesize || fmt.filesize_approx;
      const filesizeEstimated = !filesize ? calculateEstimatedFilesize(overallDuration, fmt.tbr, fmt.vbr, fmt.abr) : undefined;
      const aspectRatio = calculateAspectRatio(fmt.width, fmt.height);
      const isHdr = !!(fmt.dynamic_range && (fmt.dynamic_range.includes('HDR') || fmt.dynamic_range.includes('DV') || fmt.dynamic_range.includes('HLG')));

      // Progressive MP4 or HLS stream on X (Twitter)
      // Note: On Twitter, progressive MP4s and m3u8 playlists contain multiplexed audio & video.
      const isProgressiveWithAudio = hasVideo && (hasAudio || fmt.ext === 'mp4' || fmt.format_id.includes('http'));

      const option: QualityOption = {
        formatId: fmt.format_id,
        ext: fmt.ext || 'mp4',
        resolution,
        width: fmt.width,
        height: fmt.height,
        aspectRatio,
        filesize: fmt.filesize,
        filesizeApprox: fmt.filesize_approx,
        filesizeEstimated,
        qualityLabel: resolution ? `${resolution} MP4` : fmt.format_note || 'Standard MP4',
        hasVideo: Boolean(hasVideo),
        hasAudio: Boolean(isProgressiveWithAudio),
        category: hasVideo ? 'video' : 'audio',
        fps: fmt.fps,
        vcodec: fmt.vcodec,
        acodec: fmt.acodec,
        tbr: fmt.tbr,
        hdr: isHdr,
        requiresConversion: false,
        requiresMux: !isProgressiveWithAudio,
        audioIncluded: true,
      };

      acceptedCount++;

      if (hasVideo) {
        const key = resolution || `${fmt.height || 0}p`;
        if (!videoMap.has(key) || (fmt.tbr || 0) > (videoMap.get(key)?.tbr || 0)) {
          videoMap.set(key, option);
        }
        combinedOptions.push(option);
      } else if (hasAudio) {
        audioOptions.push(option);
      }
    }

    const videoList = Array.from(videoMap.values());
    videoList.sort((a, b) => (b.height || 0) - (a.height || 0));
    combinedOptions.sort((a, b) => (b.height || 0) - (a.height || 0));

    if (ffmpegAvailable) {
      this.appendConvertedAudioFormats(audioOptions, overallDuration);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MediaHub TwitterNormalizer] Provider: ${this.providerName}`);
      console.log(`  Raw Formats: ${rawFormats?.length || 0} | Accepted: ${acceptedCount} | Rejected: ${rejectedCount}`);
      console.log(`  Video Formats: ${videoList.length} | Combined Formats: ${combinedOptions.length} | Audio Formats: ${audioOptions.length}`);
      if (rejectionReasons.length > 0) {
        console.log(`  Rejection Reasons: ${rejectionReasons.join('; ')}`);
      }
    }

    return {
      video: videoList.slice(0, 16),
      audio: audioOptions,
      combined: combinedOptions.slice(0, 16),
    };
  }
}
