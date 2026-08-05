import { describe, it, expect } from 'vitest';
import { MetadataWriter } from '../src/metadata/MetadataWriter';
import { ArtworkEmbedder } from '../src/metadata/ArtworkEmbedder';

describe('MetadataWriter & ArtworkEmbedder', () => {
  it('builds FFmpeg metadata arguments from AudioTrackMetadata', () => {
    const args = MetadataWriter.buildFFmpegMetadataArgs({
      title: 'Blank Space',
      artist: 'Taylor Swift',
      album: '1989',
      year: '2014',
      trackNumber: 2,
      totalTracks: 13,
    });

    expect(args).toContain('-metadata');
    expect(args).toContain('title=Blank Space');
    expect(args).toContain('artist=Taylor Swift');
    expect(args).toContain('album=1989');
    expect(args).toContain('track=2/13');
  });

  it('generates customized track filenames from templates', () => {
    const filename = ArtworkEmbedder.generateOutputTemplate('{track}. {artist} - {title}', {
      artist: 'Taylor Swift',
      title: 'Style',
      trackNumber: 3,
    });

    expect(filename).toBe('03. Taylor Swift - Style');
  });

  it('sanitizes illegal characters in track filenames', () => {
    const sanitized = ArtworkEmbedder.sanitizeFilename('Song: Title/Subtitle?');
    expect(sanitized).toBe('Song_ Title_Subtitle_');
  });
});
