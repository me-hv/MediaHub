export interface SearchDocument {
  id: string;
  index: 'downloads' | 'projects' | 'playlists' | 'history';
  title: string;
  tags?: string[];
  content: string;
}

export interface ISearchProvider {
  indexDocument(doc: SearchDocument): Promise<void>;
  updateDocument(id: string, doc: Partial<SearchDocument>): Promise<boolean>;
  deleteDocument(id: string): Promise<boolean>;
  search(index: 'downloads' | 'projects' | 'playlists' | 'history', query: string): Promise<SearchDocument[]>;
  health(): Promise<{ status: string; indexedCount: number }>;
}

export class SearchService implements ISearchProvider {
  private indexStore: Map<string, SearchDocument[]> = new Map();

  async indexDocument(doc: SearchDocument): Promise<void> {
    const list = this.indexStore.get(doc.index) || [];
    list.push(doc);
    this.indexStore.set(doc.index, list);
  }

  async updateDocument(id: string, partial: Partial<SearchDocument>): Promise<boolean> {
    for (const [index, list] of this.indexStore.entries()) {
      const idx = list.findIndex((item) => item.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...partial };
        return true;
      }
    }
    return false;
  }

  async deleteDocument(id: string): Promise<boolean> {
    for (const [index, list] of this.indexStore.entries()) {
      const idx = list.findIndex((item) => item.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  async search(index: 'downloads' | 'projects' | 'playlists' | 'history', query: string): Promise<SearchDocument[]> {
    const list = this.indexStore.get(index) || [];
    const q = query.toLowerCase().trim();
    if (!q) return list;

    return list.filter((doc) => doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q));
  }

  async health(): Promise<{ status: string; indexedCount: number }> {
    let total = 0;
    this.indexStore.forEach((list) => (total += list.length));
    return {
      status: 'healthy',
      indexedCount: total,
    };
  }
}

export const globalSearchService = new SearchService();
