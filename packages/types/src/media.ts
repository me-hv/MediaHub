export type PlatformType =
  | 'YOUTUBE'
  | 'INSTAGRAM'
  | 'X'
  | 'REDDIT'
  | 'TIKTOK'
  | 'FACEBOOK'
  | 'VIMEO'
  | 'THREADS'
  | 'PINTEREST'
  | 'UNKNOWN';

export type MediaType = 'VIDEO' | 'AUDIO' | 'COMBINED' | 'SUBTITLE' | 'THUMBNAIL';

export type QualityCategory = 'video' | 'audio' | 'combined';

export interface QualityOption {
  formatId: string;
  ext: string;
  resolution?: string;
  filesize?: number;
  filesizeApprox?: number;
  qualityLabel?: string;
  hasVideo: boolean;
  hasAudio: boolean;
  category: QualityCategory;
  fps?: number;
  vcodec?: string;
  acodec?: string;
}

export interface CategorizedQualities {
  video: QualityOption[];
  audio: QualityOption[];
  combined: QualityOption[];
}

export interface MediaMetadata {
  url: string;
  urlHash: string;
  title: string;
  uploader?: string;
  duration?: number;
  thumbnail?: string;
  viewCount?: number;
  uploadDate?: string;
  description?: string;
  platform: PlatformType;
  qualities: CategorizedQualities;
  cachedAt?: string;
}

export interface PlaylistItemData {
  id: string;
  title: string;
  rawUrl: string;
  thumbnail?: string;
  duration?: number;
  position: number;
}

export interface PlaylistMetadata {
  rawUrl: string;
  title: string;
  videoCount: number;
  estimatedSize?: number;
  items: PlaylistItemData[];
}

export interface SubtitleOption {
  language: string;
  languageCode: string;
  format: 'vtt' | 'srt' | 'json';
  url: string;
}
