import { describe, it, expect } from 'vitest';
import { StorageFactory } from '../src';

describe('StorageFactory', () => {
  it('should instantiate default local storage provider', () => {
    const provider = StorageFactory.getProvider();
    expect(provider).toBeDefined();
  });
});
