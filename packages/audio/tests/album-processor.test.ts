import { describe, it, expect } from 'vitest';
import { AlbumProcessor } from '../src/batch/AlbumProcessor';
import { AlbumMetadata } from '../src/types';

describe('AlbumProcessor', () => {
  const sampleAlbum: AlbumMetadata = {
    id: 'album-1',
    title: '1989',
    artist: 'Taylor Swift',
    totalTracks: 3,
    tracks: [
      { id: 't1', title: 'Welcome To New York', artist: 'Taylor Swift', duration: 212, trackNumber: 1, url: 'https://...' },
      { id: 't2', title: 'Blank Space', artist: 'Taylor Swift', duration: 231, trackNumber: 2, url: 'https://...' },
      { id: 't3', title: 'Style', artist: 'Taylor Swift', duration: 231, trackNumber: 3, url: 'https://...' },
    ],
  };

  it('filters selected tracks by ID', () => {
    const selected = AlbumProcessor.filterSelectedTracks(sampleAlbum, ['t1', 't3']);
    expect(selected).toHaveLength(2);
    expect(selected[0].title).toBe('Welcome To New York');
    expect(selected[1].title).toBe('Style');
  });

  it('returns all tracks if selectedTrackIds is empty', () => {
    const all = AlbumProcessor.filterSelectedTracks(sampleAlbum, []);
    expect(all).toHaveLength(3);
  });

  it('formats track filenames with extensions correctly', () => {
    const filename = AlbumProcessor.formatTrackFilename(sampleAlbum.tracks[0], 'flac');
    expect(filename).toBe('01. Welcome To New York.flac');
  });
});
