import { applyReview, type ReviewResult } from '@domain/study/entities/Card';
import { replaceCard, type Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError } from '@shared/errors/AppError';

export class ReviewCardUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async execute(studyId: string, cardId: string, result: ReviewResult): Promise<Study> {
    const study = await this.studies.findById(studyId);
    if (!study) {
      throw new AppError(`Study ${studyId} not found`);
    }
    const card = study.cards.find((c) => c.id === cardId);
    if (!card) {
      throw new AppError(`Card ${cardId} not found in study ${studyId}`);
    }
    const updated = applyReview(card, result);
    const next = replaceCard(study, updated);
    await this.studies.save(next);
    return next;
  }
}
