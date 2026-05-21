import { attachIssue } from '@domain/study/entities/Card';
import { type CardIssue, type CardIssueType, createIssue } from '@domain/study/entities/CardIssue';
import { replaceCard, type Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError, ValidationError } from '@shared/errors/AppError';

export class MarkCardIssueUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async execute(
    studyId: string,
    cardId: string,
    type: CardIssueType,
    description: string,
  ): Promise<{ study: Study; issue: CardIssue }> {
    if (!description.trim() && type === 'other') {
      throw new ValidationError('Describe the issue when picking "other"');
    }
    const study = await this.studies.findById(studyId);
    if (!study) throw new AppError(`Study ${studyId} not found`);
    const card = study.cards.find((c) => c.id === cardId);
    if (!card) throw new AppError(`Card ${cardId} not found in study ${studyId}`);
    const issue = createIssue({ type, description });
    const updatedCard = attachIssue(card, issue);
    const next = replaceCard(study, updatedCard);
    await this.studies.save(next);
    return { study: next, issue };
  }
}
