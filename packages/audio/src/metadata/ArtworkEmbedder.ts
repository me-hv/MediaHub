export class ArtworkEmbedder {
  static sanitizeFilename(str: string): string {
    return str.replace(/[/\\?%*:|"<>]/g, '_').trim();
  }

  static generateOutputTemplate(template: string, metadata: { artist: string; title: string; album?: string; trackNumber?: number }): string {
    let result = template || '{artist} - {title}';
    result = result.replace(/{artist}/g, metadata.artist || 'Unknown Artist');
    result = result.replace(/{title}/g, metadata.title || 'Untitled Track');
    result = result.replace(/{album}/g, metadata.album || 'Unknown Album');
    result = result.replace(/{track}/g, metadata.trackNumber ? metadata.trackNumber.toString().padStart(2, '0') : '01');
    return this.sanitizeFilename(result);
  }
}
