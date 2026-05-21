import type { Card } from '../entities/Card';

export interface DedupeOutcome {
  unique: Card[];
  duplicatesRemoved: number;
}

const COMBINING_MARKS = /[̀-ͯ]/g;
const PUNCTUATION = /[^\p{L}\p{N}\s]/gu;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(PUNCTUATION, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cardFingerprint(card: Pick<Card, 'front' | 'back'>): string {
  return `${normalize(card.front)}::${normalize(card.back)}`;
}

export function dedupeCards(
  candidates: readonly Card[],
  existing: readonly Card[] = [],
): DedupeOutcome {
  const seen = new Set<string>(existing.map(cardFingerprint));
  const unique: Card[] = [];
  let duplicatesRemoved = 0;
  for (const card of candidates) {
    const key = cardFingerprint(card);
    if (seen.has(key)) {
      duplicatesRemoved++;
      continue;
    }
    seen.add(key);
    unique.push(card);
  }
  return { unique, duplicatesRemoved };
}
