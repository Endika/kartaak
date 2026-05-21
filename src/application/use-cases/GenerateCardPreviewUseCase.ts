import type { Card } from '@domain/study/entities/Card';
import { createCard } from '@domain/study/entities/Card';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type { ICardGeneratorService } from '@domain/ai-generation/services/ICardGeneratorService';
import { dedupeCards } from '@domain/study/services/cardDeduplication';

const PREVIEW_SAMPLE_SIZE = 4;

export class GenerateCardPreviewUseCase {
  constructor(private readonly generator: ICardGeneratorService) {}

  async execute(workflow: StudyWorkflow): Promise<Card[]> {
    const raw = await this.generator.generate(workflow, PREVIEW_SAMPLE_SIZE);
    const cards = raw.map((r) => createCard(r));
    const { unique } = dedupeCards(cards);
    return unique;
  }
}
