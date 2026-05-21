import { addDaysIso, nowIso } from '@shared/utils/clock';
import { describe, expect, it } from 'vitest';
import type { Card } from '../../entities/Card';
import { createCard } from '../../entities/Card';
import { createStudy } from '../../entities/Study';
import { createWorkflow } from '../../value-objects/StudyWorkflow';
import { selectStudySession } from '../studyScheduler';

const noShuffle = <T>(xs: T[]) => xs;

function someStudy(cards: Card[]) {
  const workflow = createWorkflow({
    theme: 'test',
    topics: [],
    instructions: '',
    quantity: 10,
    includeImages: false,
    aiModel: 'gemini',
  });
  return createStudy(workflow, cards);
}

function cardWith(overrides: Partial<Card>): Card {
  return { ...createCard({ front: 'f', back: 'b' }), ...overrides };
}

describe('selectStudySession', () => {
  const now = nowIso();
  const past = addDaysIso(now, -1);
  const future = addDaysIso(now, +1);

  it('orders buckets learning → new → learned-due', () => {
    const learning = cardWith({ front: 'L', status: 'learning', nextReviewAt: past });
    const fresh = cardWith({ front: 'N', status: 'new' });
    const due = cardWith({ front: 'D', status: 'learned', nextReviewAt: past });
    const study = someStudy([fresh, due, learning]); // intentionally reversed

    const { cards } = selectStudySession(study, { now, shuffle: noShuffle });
    expect(cards.map((c) => c.front)).toEqual(['L', 'N', 'D']);
  });

  it('skips learned cards that are not due yet', () => {
    const notDue = cardWith({ front: 'N1', status: 'learned', nextReviewAt: future });
    const fresh = cardWith({ front: 'N2', status: 'new' });
    const study = someStudy([notDue, fresh]);

    const { cards } = selectStudySession(study, { now, shuffle: noShuffle });
    expect(cards.map((c) => c.front)).toEqual(['N2']);
  });

  it('returns allCaughtUp when only non-due learned cards remain', () => {
    const study = someStudy([
      cardWith({ status: 'learned', nextReviewAt: future }),
      cardWith({ status: 'learned', nextReviewAt: future }),
    ]);
    const result = selectStudySession(study, { now, shuffle: noShuffle });
    expect(result.cards).toEqual([]);
    expect(result.allCaughtUp).toBe(true);
  });

  it('does NOT mark allCaughtUp when the deck is empty', () => {
    const result = selectStudySession(someStudy([]), { now, shuffle: noShuffle });
    expect(result.allCaughtUp).toBe(false);
  });

  it('force=true includes learned cards that are not due', () => {
    const notDue = cardWith({ front: 'N1', status: 'learned', nextReviewAt: future });
    const fresh = cardWith({ front: 'N2', status: 'new' });
    const study = someStudy([notDue, fresh]);

    const { cards } = selectStudySession(study, { now, force: true, shuffle: noShuffle });
    expect(cards.map((c) => c.front)).toEqual(['N2', 'N1']);
  });

  it('applies the limit after ordering', () => {
    const cards = Array.from({ length: 5 }, (_, i) => cardWith({ front: `c${i}`, status: 'new' }));
    const { cards: selected } = selectStudySession(someStudy(cards), {
      now,
      limit: 3,
      shuffle: noShuffle,
    });
    expect(selected).toHaveLength(3);
    expect(selected.map((c) => c.front)).toEqual(['c0', 'c1', 'c2']);
  });

  it('treats cards without nextReviewAt as due', () => {
    const noDate = cardWith({ status: 'learned', nextReviewAt: null });
    const { cards } = selectStudySession(someStudy([noDate]), { now, shuffle: noShuffle });
    expect(cards).toHaveLength(1);
  });
});
