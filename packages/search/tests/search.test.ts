import { describe, it, expect } from 'vitest';
import { SearchService } from '../src/SearchService';

describe('SearchService', () => {
  it('should index, update, delete, and check health', async () => {
    const search = new SearchService();
    await search.indexDocument({
      id: 'd1',
      index: 'downloads',
      title: 'Rick Astley - Never Gonna Give You Up',
      content: 'youtube music video mp4',
    });

    const results = await search.search('downloads', 'Rick');
    expect(results).toHaveLength(1);

    await search.updateDocument('d1', { title: 'Rick Astley Updated' });
    const updated = await search.search('downloads', 'Updated');
    expect(updated).toHaveLength(1);

    const h = await search.health();
    expect(h.status).toBe('healthy');
    expect(h.indexedCount).toBe(1);

    await search.deleteDocument('d1');
    const empty = await search.search('downloads', 'Rick');
    expect(empty).toHaveLength(0);
  });
});
