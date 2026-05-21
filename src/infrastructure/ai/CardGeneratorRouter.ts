import type { ICardGeneratorService } from '@domain/ai-generation/services/ICardGeneratorService';
import type { AIModelId, StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { AIGenerationError } from '@shared/errors/AppError';

export class CardGeneratorRouter implements ICardGeneratorService {
  constructor(private readonly clients: Record<AIModelId, ICardGeneratorService>) {}

  generate(workflow: StudyWorkflow, count: number) {
    const client = this.clients[workflow.aiModel];
    if (!client) {
      throw new AIGenerationError(`No generator client wired for model "${workflow.aiModel}"`);
    }
    return client.generate(workflow, count);
  }
}
