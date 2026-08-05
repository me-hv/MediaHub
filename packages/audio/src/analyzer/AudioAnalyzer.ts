import { AudioContentType, AudioFormat } from '../types';

export class AudioAnalyzer {
  static analyzeUrl(inputUrl: string): AudioContentType {
    if (!inputUrl || typeof inputUrl !== 'string') {
      return {
        isMusic: false,
        contentType: 'STANDARD_VIDEO',
        suggestedFormat: 'mp3',
        suggestedBitrate: '320',
      };
    }

    const url = inputUrl.trim().toLowerCase();

    // 1. YouTube Music domain check
    const isYtMusicDomain = url.includes('music.youtube.com');

    // 2. Playlist / Album check
    const isPlaylist = url.includes('list=') || url.includes('/playlist');
    const isAlbum = isYtMusicDomain && (url.includes('list=olak5uy') || url.includes('/album') || url.includes('/playlist'));

    // 3. Podcast check
    const isPodcast = url.includes('podcast') || url.includes('show');

    // 4. Live Stream check
    const isLive = url.includes('/live');

    let contentType: AudioContentType['contentType'] = 'STANDARD_VIDEO';
    if (isLive) {
      contentType = 'LIVE_STREAM';
    } else if (isAlbum) {
      contentType = 'ALBUM';
    } else if (isPlaylist) {
      contentType = 'PLAYLIST';
    } else if (isPodcast) {
      contentType = 'PODCAST';
    } else if (isYtMusicDomain) {
      contentType = 'TRACK';
    }

    const isMusic = isYtMusicDomain || isAlbum || contentType === 'TRACK' || contentType === 'PODCAST';
    const suggestedFormat: AudioFormat = isMusic ? 'mp3' : 'mp3';
    const suggestedBitrate = '320';

    return {
      isMusic,
      contentType,
      suggestedFormat,
      suggestedBitrate,
    };
  }
}
