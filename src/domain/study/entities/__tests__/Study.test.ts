import { describe, expect, it } from 'vitest';
import { createWorkflow } from '../../value-objects/StudyWorkflow';
import { createCard } from '../Card';
import { appendCards, createStudy, recordDailyActivity, replaceCard } from '../Study';

function someWorkflow() {
  return createWorkflow({
    theme: 'Geography',
    topics: ['Europe', 'Asia'],
    instructions: '',
    quantity: 10,
    includeImages: false,
    aiModel: 'gemini',
  });
}

describe('Study aggregate', () => {
  it('createStudy sets the display name from the workflow', () => {
    const study = createStudy(someWorkflow(), []);
    expect(study.name).toBe('Geography — Europe, Asia');
    expect(study.cards).toEqual([]);
  });

  it('replaceCard swaps by id and bumps lastUpdatedAt', () => {
    const original = createCard({ front: 'a', back: 'b' });
    const study = createStudy(someWorkflow(), [original]);
    const updated = { ...original, front: 'A' };
    const next = replaceCard(study, updated);
    expect(next.cards[0]?.front).toBe('A');
    expect(next.cards).toHaveLength(1);
    expect(next.cards[0]).not.toBe(study.cards[0]);
  });

  it('appendCards keeps existing cards and adds new ones in order', () => {
    const a = createCard({ front: 'a', back: 'a' });
    const b = createCard({ front: 'b', back: 'b' });
    const study = createStudy(someWorkflow(), [a]);
    const next = appendCards(study, [b]);
    expect(next.cards.map((c) => c.front)).toEqual(['a', 'b']);
  });
});

describe('recordDailyActivity', () => {
  it('creates the first daily entry when history is empty', () => {
    const study = createStudy(someWorkflow(), []);
    const next = recordDailyActivity(study, '2026-05-21', {
      reviewed: 3,
      learnedTransitions: 1,
    });
    expect(next.dailyHistory).toEqual([{ date: '2026-05-21', reviewed: 3, learnedTransitions: 1 }]);
  });

  it('accumulates reviewed and learnedTransitions on the same day', () => {
    const study = createStudy(someWorkflow(), []);
    const once = recordDailyActivity(study, '2026-05-21', {
      reviewed: 2,
      learnedTransitions: 0,
    });
    const twice = recordDailyActivity(once, '2026-05-21', {
      reviewed: 5,
      learnedTransitions: 2,
    });
    expect(twice.dailyHistory).toEqual([
      { date: '2026-05-21', reviewed: 7, learnedTransitions: 2 },
    ]);
  });

  it('appends a new entry for a different day, keeping previous ones', () => {
    const study = createStudy(someWorkflow(), []);
    const day1 = recordDailyActivity(study, '2026-05-20', {
      reviewed: 1,
      learnedTransitions: 0,
    });
    const day2 = recordDailyActivity(day1, '2026-05-21', {
      reviewed: 4,
      learnedTransitions: 1,
    });
    expect(day2.dailyHistory).toHaveLength(2);
    expect(day2.dailyHistory?.map((d) => d.date)).toEqual(['2026-05-20', '2026-05-21']);
  });
});
