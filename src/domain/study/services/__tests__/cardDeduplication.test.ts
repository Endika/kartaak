import { describe, expect, it } from 'vitest';
import { createCard } from '../../entities/Card';
import { dedupeCards } from '../cardDeduplication';

describe('dedupeCards', () => {
  it('removes exact duplicates within the candidate batch', () => {
    const a = createCard({ front: '7 x 1', back: '7' });
    const b = createCard({ front: '7 x 1', back: '7' });
    const c = createCard({ front: '7 x 2', back: '14' });
    const { unique, duplicatesRemoved } = dedupeCards([a, b, c]);
    expect(unique).toHaveLength(2);
    expect(duplicatesRemoved).toBe(1);
  });

  it('normalises whitespace and case when comparing', () => {
    const a = createCard({ front: 'What  is  2+2?', back: 'Four' });
    const b = createCard({ front: 'what is 2+2?', back: 'FOUR' });
    const { unique, duplicatesRemoved } = dedupeCards([a, b]);
    expect(unique).toHaveLength(1);
    expect(duplicatesRemoved).toBe(1);
  });

  it('skips candidates that already exist in the existing set', () => {
    const existing = createCard({ front: 'Capital of Spain', back: 'Madrid' });
    const dup = createCard({ front: 'capital of spain', back: 'madrid' });
    const fresh = createCard({ front: 'Capital of France', back: 'Paris' });
    const { unique, duplicatesRemoved } = dedupeCards([dup, fresh], [existing]);
    expect(unique).toHaveLength(1);
    expect(unique[0]?.front).toBe('Capital of France');
    expect(duplicatesRemoved).toBe(1);
  });

  it('returns zero duplicates for an empty input', () => {
    expect(dedupeCards([])).toEqual({ unique: [], duplicatesRemoved: 0 });
  });

  it('ignores diacritics so accented and unaccented forms match', () => {
    const a = createCard({ front: 'Capital of France', back: 'París' });
    const b = createCard({ front: 'Capital of France', back: 'Paris' });
    const { unique, duplicatesRemoved } = dedupeCards([a, b]);
    expect(unique).toHaveLength(1);
    expect(duplicatesRemoved).toBe(1);
  });

  it('ignores punctuation differences (trailing ?, leading ¿, commas, etc.)', () => {
    const a = createCard({ front: '¿Capital de Francia?', back: 'Paris' });
    const b = createCard({ front: 'Capital de Francia', back: 'Paris.' });
    const { unique, duplicatesRemoved } = dedupeCards([a, b]);
    expect(unique).toHaveLength(1);
    expect(duplicatesRemoved).toBe(1);
  });
});
