import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';

export interface GeneratedCard {
  front: string;
  back: string;
  imageUrl?: string;
}

export interface ICardGeneratorService {
  generate(workflow: StudyWorkflow, count: number): Promise<GeneratedCard[]>;
}
