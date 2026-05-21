import { describe, expect, it } from 'vitest';
import {
  applyReview,
  attachIssue,
  type Card,
  createCard,
  editCardContent,
  pendingIssueCount,
  updateIssueInCard,
} from '../Card';
import { createIssue } from '../CardIssue';

function newCard(): Card {
  return createCard({ front: '  Capital of France  ', back: '  Paris  ' });
}

describe('Card.createCard', () => {
  it('trims front and back and initialises counters', () => {
    const card = newCard();
    expect(card.front).toBe('Capital of France');
    expect(card.back).toBe('Paris');
    expect(card.status).toBe('new');
    expect(card.reviewCount).toBe(0);
    expect(card.correctCount).toBe(0);
    expect(card.lastReviewedAt).toBeNull();
    expect(card.nextReviewAt).toBeNull();
    expect(card.isEdited).toBe(false);
  });
});

describe('Card.applyReview', () => {
  it('moves new → learning on correct and schedules next review', () => {
    const reviewed = applyReview(newCard(), 'correct');
    expect(reviewed.status).toBe('learning');
    expect(reviewed.reviewCount).toBe(1);
    expect(reviewed.correctCount).toBe(1);
    expect(reviewed.lastReviewedAt).not.toBeNull();
    expect(reviewed.nextReviewAt).not.toBeNull();
  });

  it('moves learning → learned after a second correct', () => {
    const first = applyReview(newCard(), 'correct');
    const second = applyReview(first, 'correct');
    expect(second.status).toBe('learned');
    expect(second.correctCount).toBe(2);
    expect(second.reviewCount).toBe(2);
  });

  it('demotes learned → learning on incorrect without losing correctCount', () => {
    const c1 = applyReview(newCard(), 'correct');
    const c2 = applyReview(c1, 'correct'); // learned
    const c3 = applyReview(c2, 'incorrect');
    expect(c3.status).toBe('learning');
    expect(c3.correctCount).toBe(2);
    expect(c3.reviewCount).toBe(3);
  });

  it('treats partial as learning regardless of previous status', () => {
    const c1 = applyReview(newCard(), 'correct');
    const c2 = applyReview(c1, 'correct'); // learned
    const c3 = applyReview(c2, 'partial');
    expect(c3.status).toBe('learning');
    expect(c3.correctCount).toBe(2); // partial does not bump correct
  });
});

describe('Card.editCardContent', () => {
  it('trims content and marks the card as edited', () => {
    const edited = editCardContent(newCard(), '  new front  ', '  new back  ');
    expect(edited.front).toBe('new front');
    expect(edited.back).toBe('new back');
    expect(edited.isEdited).toBe(true);
  });
});

describe('Card issues', () => {
  it('counts only pending issues', () => {
    const card = attachIssue(newCard(), createIssue({ type: 'typo', description: 'fix it' }));
    expect(pendingIssueCount(card)).toBe(1);
  });

  it('updateIssueInCard replaces by id without touching others', () => {
    const issueA = createIssue({ type: 'typo', description: 'a' });
    const issueB = createIssue({ type: 'confusing', description: 'b' });
    const withTwo = attachIssue(attachIssue(newCard(), issueA), issueB);
    const resolved = { ...issueA, status: 'resolved' as const };
    const updated = updateIssueInCard(withTwo, resolved);
    expect(updated.issues).toHaveLength(2);
    expect(updated.issues?.find((i) => i.id === issueA.id)?.status).toBe('resolved');
    expect(updated.issues?.find((i) => i.id === issueB.id)?.status).toBe('pending');
    expect(pendingIssueCount(updated)).toBe(1);
  });
});
