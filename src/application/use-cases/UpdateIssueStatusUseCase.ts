import { updateIssueInCard } from '@domain/study/entities/Card';
import { dismissIssue, resolveIssue } from '@domain/study/entities/CardIssue';
import { replaceCard, type Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError } from '@shared/errors/AppError';

export type IssueAction = 'resolve' | 'dismiss';

export class UpdateIssueStatusUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async execute(
    studyId: string,
    cardId: string,
    issueId: string,
    action: IssueAction,
  ): Promise<Study> {
    const study = await this.studies.findById(studyId);
    if (!study) throw new AppError(`Study ${studyId} not found`);
    const card = study.cards.find((c) => c.id === cardId);
    if (!card) throw new AppError(`Card ${cardId} not found`);
    const issue = (card.issues ?? []).find((i) => i.id === issueId);
    if (!issue) throw new AppError(`Issue ${issueId} not found`);
    const updatedIssue = action === 'resolve' ? resolveIssue(issue) : dismissIssue(issue);
    const updatedCard = updateIssueInCard(card, updatedIssue);
    const next = replaceCard(study, updatedCard);
    await this.studies.save(next);
    return next;
  }
}
