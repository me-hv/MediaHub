import { CategorizedQualities, QualityOption } from '@mediahub/types';
import { BaseNormalizer, NormalizerOptions, calculateAspectRatio, calculateEstimatedFilesize } from './BaseNormalizer';
import { YtDlpDumpJsonOutput } from '../yt-dlp/YtDlpWrapper';

export class YouTubeNormalizer extends BaseNormalizer {
  readonly providerName = 'YouTube';

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

    for (const fmt of rawFormats || []) {
      if (!fmt.format_id) {
        rejectedCount++;
        continue;
      }

      const hasVideo = !!(fmt.vcodec && fmt.vcodec !== 'none');
      const hasAudio = !!(fmt.acodec && fmt.acodec !== 'none');

      if (!hasVideo && !hasAudio) {
        rejectedCount++;
        continue;
      }

      const resolution = fmt.resolution || (fmt.width && fmt.height ? `${fmt.width}×${fmt.height}` : fmt.height ? `${fmt.height}p` : undefined);
      const filesize = fmt.filesize || fmt.filesize_approx;
      const filesizeEstimated = !filesize ? calculateEstimatedFilesize(overallDuration, fmt.tbr, fmt.vbr, fmt.abr) : undefined;
      const aspectRatio = calculateAspectRatio(fmt.width, fmt.height);
      const isHdr = !!(fmt.dynamic_range && (fmt.dynamic_range.includes('HDR') || fmt.dynamic_range.includes('DV') || fmt.dynamic_range.includes('HLG')));

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
        qualityLabel: fmt.format_note || resolution || 'Standard Quality',
        hasVideo,
        hasAudio,
        category: hasVideo && hasAudio ? 'combined' : hasVideo ? 'video' : 'audio',
        fps: fmt.fps,
        vcodec: fmt.vcodec,
        acodec: fmt.acodec,
        tbr: fmt.tbr,
        hdr: isHdr,
        requiresConversion: false,
        requiresMux: false,
        audioIncluded: true,
      };

      acceptedCount++;

      if (hasVideo && hasAudio) {
        // Native multiplexed stream
        const key = resolution || `${fmt.height || 0}p`;
        if (!videoMap.has(key)) {
          videoMap.set(key, option);
        }
        combinedOptions.push(option);
      } else if (hasVideo) {
        // Video-only DASH stream -> Create Virtual Merged Combined Option (+bestaudio)
        const key = resolution || `${fmt.height || 0}p`;
        if (!videoMap.has(key)) {
          const mergedOption: QualityOption = {
            ...option,
            formatId: `${fmt.format_id}+bestaudio`,
            ext: 'mp4',
            hasAudio: true,
            audioIncluded: true,
            requiresMux: true,
            qualityLabel: resolution ? `${resolution} MP4` : 'Video MP4',
          };
          videoMap.set(key, mergedOption);
          combinedOptions.push(mergedOption);
        }
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
      console.log(`[MediaHub YouTubeNormalizer] Raw Formats: ${rawFormats?.length || 0} | Accepted: ${acceptedCount} | Rejected: ${rejectedCount}`);
      console.log(`  Video Options: ${videoList.length} | Combined Options: ${combinedOptions.length} | Audio Options: ${audioOptions.length}`);
    }

    return {
      video: videoList.slice(0, 16),
      audio: audioOptions,
      combined: combinedOptions.slice(0, 16),
    };
  }
}
