import type {
  GeneratedCard,
  ICardGeneratorService,
} from '@domain/ai-generation/services/ICardGeneratorService';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';

export class FakeCardGenerator implements ICardGeneratorService {
  public lastWorkflow: StudyWorkflow | null = null;
  public lastCount = 0;

  constructor(private readonly responses: GeneratedCard[][] = []) {}

  enqueue(cards: GeneratedCard[]): void {
    this.responses.push(cards);
  }

  async generate(workflow: StudyWorkflow, count: number): Promise<GeneratedCard[]> {
    this.lastWorkflow = workflow;
    this.lastCount = count;
    const next = this.responses.shift();
    if (next) return next;
    return Array.from({ length: count }, (_, i) => ({
      front: `Q${i}-${workflow.theme}`,
      back: `A${i}`,
    }));
  }
}
