import archiver from 'archiver';
import { Readable, Writable } from 'node:stream';
import { AlbumMetadata, AlbumTrackItem } from '../types';
import { ArtworkEmbedder } from '../metadata/ArtworkEmbedder';

export interface ZipTrackFile {
  filename: string;
  stream: Readable;
}

export class AlbumProcessor {
  static createZipArchive(files: ZipTrackFile[], outputWritable: Writable): Promise<void> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { store: true }); // Level 0 store mode for pre-compressed audio

      archive.on('error', (err) => reject(err));
      archive.on('end', () => resolve());

      archive.pipe(outputWritable);

      for (const file of files) {
        archive.append(file.stream, { name: file.filename });
      }

      archive.finalize();
    });
  }

  static filterSelectedTracks(album: AlbumMetadata, selectedTrackIds?: string[]): AlbumTrackItem[] {
    if (!selectedTrackIds || selectedTrackIds.length === 0) {
      return album.tracks;
    }
    const idSet = new Set(selectedTrackIds);
    return album.tracks.filter((t) => idSet.has(t.id));
  }

  static formatTrackFilename(track: AlbumTrackItem, ext: string, template = '{track}. {title}'): string {
    const baseName = ArtworkEmbedder.generateOutputTemplate(template, {
      artist: track.artist,
      title: track.title,
      trackNumber: track.trackNumber,
    });
    return `${baseName}.${ext}`;
  }
}
