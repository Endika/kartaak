import { editCardContent, updateIssueInCard } from '@domain/study/entities/Card';
import { resolveIssue } from '@domain/study/entities/CardIssue';
import { replaceCard, type Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError, ValidationError } from '@shared/errors/AppError';

export class ApplyIssueResolutionUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async execute(
    studyId: string,
    cardId: string,
    issueId: string,
    proposedFront: string,
    proposedBack: string,
  ): Promise<Study> {
    if (!proposedFront.trim() || !proposedBack.trim()) {
      throw new ValidationError('Resolution must include both front and back');
    }
    const study = await this.studies.findById(studyId);
    if (!study) throw new AppError(`Study ${studyId} not found`);
    const card = study.cards.find((c) => c.id === cardId);
    if (!card) throw new AppError(`Card ${cardId} not found`);
    const issue = (card.issues ?? []).find((i) => i.id === issueId);
    if (!issue) throw new AppError(`Issue ${issueId} not found`);

    const edited = editCardContent(card, proposedFront, proposedBack);
    const resolved = updateIssueInCard(edited, resolveIssue(issue));
    const next = replaceCard(study, resolved);
    await this.studies.save(next);
    return next;
  }
}
