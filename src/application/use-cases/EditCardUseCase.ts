import { editCardContent } from '@domain/study/entities/Card';
import { replaceCard, type Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError, ValidationError } from '@shared/errors/AppError';

export class EditCardUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async execute(studyId: string, cardId: string, front: string, back: string): Promise<Study> {
    if (!front.trim() || !back.trim()) {
      throw new ValidationError('Front and back are required');
    }
    const study = await this.studies.findById(studyId);
    if (!study) throw new AppError(`Study ${studyId} not found`);
    const card = study.cards.find((c) => c.id === cardId);
    if (!card) throw new AppError(`Card ${cardId} not found in study ${studyId}`);
    const updated = editCardContent(card, front, back);
    const next = replaceCard(study, updated);
    await this.studies.save(next);
    return next;
  }
}
