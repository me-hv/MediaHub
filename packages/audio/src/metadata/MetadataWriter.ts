import { AudioTrackMetadata } from '../types';

export class MetadataWriter {
  static buildFFmpegMetadataArgs(metadata: Partial<AudioTrackMetadata>): string[] {
    const args: string[] = [];

    if (metadata.title) args.push('-metadata', `title=${metadata.title}`);
    if (metadata.artist) args.push('-metadata', `artist=${metadata.artist}`);
    if (metadata.album) args.push('-metadata', `album=${metadata.album}`);
    if (metadata.genre) args.push('-metadata', `genre=${metadata.genre}`);
    if (metadata.year) args.push('-metadata', `date=${metadata.year}`);
    if (metadata.trackNumber) {
      const trackStr = metadata.totalTracks ? `${metadata.trackNumber}/${metadata.totalTracks}` : `${metadata.trackNumber}`;
      args.push('-metadata', `track=${trackStr}`);
    }
    if (metadata.discNumber) args.push('-metadata', `disc=${metadata.discNumber}`);
    if (metadata.composer) args.push('-metadata', `composer=${metadata.composer}`);
    if (metadata.copyright) args.push('-metadata', `copyright=${metadata.copyright}`);
    if (metadata.isrc) args.push('-metadata', `isrc=${metadata.isrc}`);
    if (metadata.lyrics) args.push('-metadata', `lyrics=${metadata.lyrics}`);

    return args;
  }
}
