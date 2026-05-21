import type { Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError, ValidationError } from '@shared/errors/AppError';
import { nowIso } from '@shared/utils/clock';

export class RenameStudyUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async execute(studyId: string, newName: string): Promise<Study> {
    const trimmed = newName.trim();
    if (trimmed.length < 1) {
      throw new ValidationError('Name cannot be empty');
    }
    const study = await this.studies.findById(studyId);
    if (!study) throw new AppError(`Study ${studyId} not found`);
    const next: Study = { ...study, name: trimmed, lastUpdatedAt: nowIso() };
    await this.studies.save(next);
    return next;
  }
}
