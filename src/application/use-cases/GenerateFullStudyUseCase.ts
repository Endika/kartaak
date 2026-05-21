import type { ICardGeneratorService } from '@domain/ai-generation/services/ICardGeneratorService';
import { createCard } from '@domain/study/entities/Card';
import { createStudy, type Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { dedupeCards } from '@domain/study/services/cardDeduplication';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { AIGenerationError } from '@shared/errors/AppError';

export interface GenerateFullStudyResult {
  study: Study;
  duplicatesRemoved: number;
}

export class GenerateFullStudyUseCase {
  constructor(
    private readonly generator: ICardGeneratorService,
    private readonly studies: IStudyRepository,
  ) {}

  async execute(workflow: StudyWorkflow): Promise<GenerateFullStudyResult> {
    const raw = await this.generator.generate(workflow, workflow.quantity);
    if (raw.length === 0) {
      throw new AIGenerationError('Generator returned no cards');
    }
    const cards = raw.map((r) => createCard(r));
    const { unique, duplicatesRemoved } = dedupeCards(cards);
    const study = createStudy(workflow, unique);
    await this.studies.save(study);
    return { study, duplicatesRemoved };
  }
}
