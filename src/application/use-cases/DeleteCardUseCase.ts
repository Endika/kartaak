import type { Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError } from '@shared/errors/AppError';
import { nowIso } from '@shared/utils/clock';

export class DeleteCardUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async execute(studyId: string, cardId: string): Promise<Study> {
    const study = await this.studies.findById(studyId);
    if (!study) throw new AppError(`Study ${studyId} not found`);
    const next: Study = {
      ...study,
      cards: study.cards.filter((c) => c.id !== cardId),
      lastUpdatedAt: nowIso(),
    };
    await this.studies.save(next);
    return next;
  }
}
