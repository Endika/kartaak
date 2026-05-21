import { type ISODate, nowIso } from '@shared/utils/clock';
import { newId } from '@shared/utils/ids';

export type CardIssueType = 'incorrect' | 'confusing' | 'typo' | 'difficulty' | 'other';
export type CardIssueStatus = 'pending' | 'resolved' | 'dismissed';

export interface CardIssue {
  id: string;
  type: CardIssueType;
  description: string;
  status: CardIssueStatus;
  createdAt: ISODate;
  resolvedAt?: ISODate;
}

export function createIssue(input: { type: CardIssueType; description: string }): CardIssue {
  return {
    id: newId(),
    type: input.type,
    description: input.description.trim(),
    status: 'pending',
    createdAt: nowIso(),
  };
}

export function resolveIssue(issue: CardIssue): CardIssue {
  return { ...issue, status: 'resolved', resolvedAt: nowIso() };
}

export function dismissIssue(issue: CardIssue): CardIssue {
  return { ...issue, status: 'dismissed', resolvedAt: nowIso() };
}
