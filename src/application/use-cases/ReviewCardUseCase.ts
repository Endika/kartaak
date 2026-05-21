import { applyReview, type ReviewResult } from '@domain/study/entities/Card';
import { recordDailyActivity, replaceCard, type Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError } from '@shared/errors/AppError';
import { todayKey } from '@shared/utils/clock';

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
    const justLearned = card.status !== 'learned' && updated.status === 'learned';
    const replaced = replaceCard(study, updated);
    const withHistory = recordDailyActivity(replaced, todayKey(), {
      reviewed: 1,
      learnedTransitions: justLearned ? 1 : 0,
    });
    await this.studies.save(withHistory);
    return withHistory;
  }
}
