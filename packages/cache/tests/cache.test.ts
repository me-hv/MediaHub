import { describe, it, expect } from 'vitest';
import { RedisCacheService } from '../src';

describe('RedisCacheService', () => {
  it('should store, retrieve, and delete items from cache', async () => {
    await RedisCacheService.set('test-key', { foo: 'bar' }, 60);
    const val = await RedisCacheService.get<{ foo: string }>('test-key');
    expect(val?.foo).toBe('bar');

    await RedisCacheService.delete('test-key');
    const empty = await RedisCacheService.get('test-key');
    expect(empty).toBeNull();
  });
});
