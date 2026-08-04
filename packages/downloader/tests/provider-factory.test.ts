import { describe, it, expect } from 'vitest';
import { ProviderFactory } from '../src/factory/ProviderFactory';
import { YoutubeProvider } from '../src/providers/YoutubeProvider';
import { GenericYtDlpProvider } from '../src/providers/GenericYtDlpProvider';

describe('ProviderFactory', () => {
  it('returns YoutubeProvider for youtube links', () => {
    const provider = ProviderFactory.getProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(provider).toBeInstanceOf(YoutubeProvider);
    expect(provider.name).toBe('YoutubeProvider');
  });

  it('returns GenericYtDlpProvider for unmapped domains', () => {
    const provider = ProviderFactory.getProvider('https://vimeo.com/76979871');
    expect(provider).toBeInstanceOf(GenericYtDlpProvider);
    expect(provider.name).toBe('GenericYtDlpProvider');
  });
});
