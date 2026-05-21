import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';

export class DeleteStudyUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async execute(studyId: string): Promise<void> {
    await this.studies.delete(studyId);
  }
}
