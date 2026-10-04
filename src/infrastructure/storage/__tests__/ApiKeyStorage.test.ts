import { afterEach, describe, expect, it } from 'vitest';
import { LocalStorageApiKeyStorage } from '../ApiKeyStorage';

afterEach(() => {
  localStorage.clear();
});

describe('LocalStorageApiKeyStorage', () => {
  it('keeps a 53-character AQ. Gemini key exactly as typed', () => {
    const key = `AQ.${'Ab1-_x'.repeat(8)}zz`;
    const storage = new LocalStorageApiKeyStorage();
    storage.set('gemini', `  ${key}\n`);
    expect(storage.get('gemini')).toBe(key);
  });
});
