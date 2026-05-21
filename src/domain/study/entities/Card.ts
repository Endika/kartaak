import { addDaysIso, type ISODate, nowIso } from '@shared/utils/clock';
import { newId } from '@shared/utils/ids';
import type { CardIssue } from './CardIssue';

export type CardStatus = 'new' | 'learning' | 'learned';
export type ReviewResult = 'correct' | 'partial' | 'incorrect';

export interface Card {
  id: string;
  front: string;
  back: string;
  imageUrl?: string;
  status: CardStatus;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt: ISODate | null;
  nextReviewAt: ISODate | null;
  isEdited: boolean;
  issues?: CardIssue[];
  createdAt: ISODate;
}

export function createCard(input: { front: string; back: string; imageUrl?: string }): Card {
  const now = nowIso();
  return {
    id: newId(),
    front: input.front.trim(),
    back: input.back.trim(),
    ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
    status: 'new',
    reviewCount: 0,
    correctCount: 0,
    lastReviewedAt: null,
    nextReviewAt: null,
    isEdited: false,
    issues: [],
    createdAt: now,
  };
}

export function attachIssue(card: Card, issue: CardIssue): Card {
  return { ...card, issues: [...(card.issues ?? []), issue] };
}

export function updateIssueInCard(card: Card, updated: CardIssue): Card {
  return {
    ...card,
    issues: (card.issues ?? []).map((i) => (i.id === updated.id ? updated : i)),
  };
}

export function pendingIssueCount(card: Card): number {
  return (card.issues ?? []).filter((i) => i.status === 'pending').length;
}

const INTERVAL_DAYS_BY_STATUS: Record<CardStatus, number> = {
  new: 1,
  learning: 3,
  learned: 7,
};

export function applyReview(card: Card, result: ReviewResult): Card {
  const now = nowIso();
  const reviewCount = card.reviewCount + 1;
  const correctCount = result === 'correct' ? card.correctCount + 1 : card.correctCount;
  const status = nextStatus(card.status, result);
  const nextReviewAt = addDaysIso(now, INTERVAL_DAYS_BY_STATUS[status]);
  return {
    ...card,
    status,
    reviewCount,
    correctCount,
    lastReviewedAt: now,
    nextReviewAt,
  };
}

function nextStatus(current: CardStatus, result: ReviewResult): CardStatus {
  if (result === 'incorrect') return 'learning';
  if (result === 'partial') return 'learning';
  if (current === 'new') return 'learning';
  if (current === 'learning') return 'learned';
  return 'learned';
}

export function editCardContent(card: Card, front: string, back: string): Card {
  return {
    ...card,
    front: front.trim(),
    back: back.trim(),
    isEdited: true,
  };
}
