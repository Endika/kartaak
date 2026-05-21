import type { ISODate } from '@shared/utils/clock';
import type { Card } from '../entities/Card';
import type { Study } from '../entities/Study';

export interface SchedulerOptions {
  now: ISODate;
  limit?: number;
  force?: boolean;
  shuffle?: (cards: Card[]) => Card[];
}

export interface SchedulerResult {
  cards: Card[];
  allCaughtUp: boolean;
}

export function selectStudySession(study: Study, opts: SchedulerOptions): SchedulerResult {
  const shuffle = opts.shuffle ?? defaultShuffle;
  const learning: Card[] = [];
  const newCards: Card[] = [];
  const learnedDue: Card[] = [];
  const learnedLater: Card[] = [];

  for (const card of study.cards) {
    if (card.status === 'learning') learning.push(card);
    else if (card.status === 'new') newCards.push(card);
    else if (isDue(card, opts.now)) learnedDue.push(card);
    else learnedLater.push(card);
  }

  const ordered = opts.force
    ? [...shuffle(learning), ...shuffle(newCards), ...shuffle(learnedDue), ...shuffle(learnedLater)]
    : [...shuffle(learning), ...shuffle(newCards), ...shuffle(learnedDue)];

  const allCaughtUp = !opts.force && ordered.length === 0 && learnedLater.length > 0;
  const limited = opts.limit !== undefined ? ordered.slice(0, opts.limit) : ordered;

  return { cards: limited, allCaughtUp };
}

function isDue(card: Card, now: ISODate): boolean {
  if (!card.nextReviewAt) return true;
  return card.nextReviewAt <= now;
}

function defaultShuffle(cards: Card[]): Card[] {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i] as Card;
    out[i] = out[j] as Card;
    out[j] = tmp;
  }
  return out;
}
