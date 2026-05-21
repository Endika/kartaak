import type { Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError } from '@shared/errors/AppError';

export const STUDY_EXPORT_FORMAT_VERSION = 1;

export interface StudyExportEnvelope {
  format: 'kartaak.study';
  version: number;
  exportedAt: string;
  study: Study;
}

export class ExportStudyUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async execute(studyId: string): Promise<StudyExportEnvelope> {
    const study = await this.studies.findById(studyId);
    if (!study) throw new AppError(`Study ${studyId} not found`);
    return {
      format: 'kartaak.study',
      version: STUDY_EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      study,
    };
  }
}
