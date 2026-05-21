import type { Card } from '../entities/Card';

export interface DedupeOutcome {
  unique: Card[];
  duplicatesRemoved: number;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function fingerprint(card: Pick<Card, 'front' | 'back'>): string {
  return `${normalize(card.front)}::${normalize(card.back)}`;
}

export function dedupeCards(
  candidates: readonly Card[],
  existing: readonly Card[] = []
): DedupeOutcome {
  const seen = new Set<string>(existing.map(fingerprint));
  const unique: Card[] = [];
  let duplicatesRemoved = 0;
  for (const card of candidates) {
    const key = fingerprint(card);
    if (seen.has(key)) {
      duplicatesRemoved++;
      continue;
    }
    seen.add(key);
    unique.push(card);
  }
  return { unique, duplicatesRemoved };
}
