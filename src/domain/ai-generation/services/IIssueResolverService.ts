import type { Card } from '@domain/study/entities/Card';
import type { CardIssue } from '@domain/study/entities/CardIssue';
import type { AIModelId } from '@domain/study/value-objects/StudyWorkflow';

export interface IssueResolution {
  proposedFront: string;
  proposedBack: string;
  rationale?: string;
}

export interface IIssueResolverService {
  resolve(model: AIModelId, card: Card, issue: CardIssue): Promise<IssueResolution>;
}
