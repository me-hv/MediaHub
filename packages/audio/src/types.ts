export type AudioFormat = 'mp3' | 'flac' | 'wav' | 'aac' | 'm4a' | 'opus' | 'ogg';

export type Mp3Bitrate = '320' | '256' | '192' | '160' | '128';
export type AacBitrate = '320' | '256' | '192' | '128';
export type OpusBitrate = '192' | '160' | '128' | '96' | '64';
export type FlacBitDepth = '16' | '24';
export type WavPcmDepth = '16' | '24' | '32';

export interface AudioTranscodeOptions {
  format: AudioFormat;
  bitrate?: Mp3Bitrate | AacBitrate | OpusBitrate | string;
  bitDepth?: FlacBitDepth | WavPcmDepth;
  normalizeLoudness?: boolean;
  sampleRate?: number; // e.g. 44100, 48000
  embedArtwork?: boolean;
  embedMetadata?: boolean;
}

export interface AudioTrackMetadata {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  year?: string;
  trackNumber?: number;
  totalTracks?: number;
  discNumber?: number;
  composer?: string;
  copyright?: string;
  isrc?: string;
  duration?: number;
  coverUrl?: string;
  lyrics?: string;
  isrcCode?: string;
}

export interface AlbumTrackItem {
  id: string;
  title: string;
  artist: string;
  duration: number;
  trackNumber: number;
  url: string;
  thumbnail?: string;
  selected?: boolean;
}

export interface AlbumMetadata {
  id: string;
  title: string;
  artist: string;
  year?: string;
  coverUrl?: string;
  totalTracks: number;
  tracks: AlbumTrackItem[];
}

export interface AudioContentType {
  isMusic: boolean;
  contentType: 'TRACK' | 'ALBUM' | 'PLAYLIST' | 'PODCAST' | 'LIVE_STREAM' | 'STANDARD_VIDEO';
  suggestedFormat: AudioFormat;
  suggestedBitrate: string;
}
