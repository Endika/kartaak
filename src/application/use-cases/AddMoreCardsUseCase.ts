import type { ICardGeneratorService } from '@domain/ai-generation/services/ICardGeneratorService';
import { createCard } from '@domain/study/entities/Card';
import { appendCards, type Study, updateWorkflow } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { dedupeCards } from '@domain/study/services/cardDeduplication';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { AIGenerationError, AppError } from '@shared/errors/AppError';

export interface AddMoreCardsResult {
  study: Study;
  added: number;
  duplicatesRemoved: number;
}

export class AddMoreCardsUseCase {
  constructor(
    private readonly generator: ICardGeneratorService,
    private readonly studies: IStudyRepository,
  ) {}

  async execute(studyId: string, workflow: StudyWorkflow): Promise<AddMoreCardsResult> {
    const study = await this.studies.findById(studyId);
    if (!study) throw new AppError(`Study ${studyId} not found`);

    const existingHints = study.cards.map((c) => ({ front: c.front, back: c.back }));
    const raw = await this.generator.generate(workflow, workflow.quantity, existingHints);
    if (raw.length === 0) {
      throw new AIGenerationError('Generator returned no cards');
    }

    const candidates = raw.map((r) => createCard(r));
    const { unique, duplicatesRemoved } = dedupeCards(candidates, study.cards);

    if (unique.length === 0) {
      throw new AIGenerationError('All generated cards were duplicates of existing ones');
    }

    const appended = appendCards(study, unique);
    const withUpdatedWorkflow = updateWorkflow(appended, workflow);
    await this.studies.save(withUpdatedWorkflow);

    return {
      study: withUpdatedWorkflow,
      added: unique.length,
      duplicatesRemoved,
    };
  }
}
