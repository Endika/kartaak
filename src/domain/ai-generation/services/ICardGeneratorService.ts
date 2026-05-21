import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';

export interface GeneratedCard {
  front: string;
  back: string;
  imageUrl?: string;
}

export interface ExistingCardHint {
  front: string;
  back: string;
}

export interface ICardGeneratorService {
  generate(
    workflow: StudyWorkflow,
    count: number,
    existing?: readonly ExistingCardHint[],
  ): Promise<GeneratedCard[]>;
}
