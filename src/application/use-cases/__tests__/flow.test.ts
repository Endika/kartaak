import { createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { InMemoryStudyRepository } from '@infrastructure/persistence/InMemoryStudyRepository';
import { describe, expect, it } from 'vitest';
import { GenerateCardPreviewUseCase } from '../GenerateCardPreviewUseCase';
import { GenerateFullStudyUseCase } from '../GenerateFullStudyUseCase';
import { ReviewCardUseCase } from '../ReviewCardUseCase';
import { FakeCardGenerator } from './fakes';

describe('study generation + review flow', () => {
  const workflow = createWorkflow({
    theme: 'Multiplication tables',
    topics: ['7', '8'],
    instructions: 'Primary school level',
    quantity: 10,
    includeImages: false,
    aiModel: 'gemini',
  });

  it('preview returns deduped cards from the generator', async () => {
    const generator = new FakeCardGenerator();
    generator.enqueue([
      { front: '7 x 1', back: '7' },
      { front: '7 x 1', back: '7' }, // duplicate
      { front: '7 x 2', back: '14' },
      { front: '7 x 3', back: '21' },
    ]);
    const useCase = new GenerateCardPreviewUseCase(generator);

    const cards = await useCase.execute(workflow);

    expect(cards).toHaveLength(3);
    expect(cards.every((c) => c.status === 'new')).toBe(true);
    expect(generator.lastCount).toBe(4);
  });

  it('full generation persists the study with workflow and reports duplicates', async () => {
    const generator = new FakeCardGenerator();
    generator.enqueue([
      { front: '7 x 1', back: '7' },
      { front: '7 x 1', back: '7' }, // duplicate
      { front: '8 x 2', back: '16' },
    ]);
    const repo = new InMemoryStudyRepository();
    const useCase = new GenerateFullStudyUseCase(generator, repo);

    const { study, duplicatesRemoved } = await useCase.execute(workflow);

    expect(duplicatesRemoved).toBe(1);
    expect(study.cards).toHaveLength(2);
    expect(study.workflow).toEqual(workflow);

    const reloaded = await repo.findById(study.id);
    expect(reloaded?.cards.map((c) => c.front)).toEqual(['7 x 1', '8 x 2']);
  });

  it('review updates card status and persists', async () => {
    const generator = new FakeCardGenerator();
    generator.enqueue([
      { front: 'Capital of France', back: 'Paris' },
      { front: 'Capital of Spain', back: 'Madrid' },
    ]);
    const repo = new InMemoryStudyRepository();
    const full = new GenerateFullStudyUseCase(generator, repo);
    const review = new ReviewCardUseCase(repo);
    const { study } = await full.execute(workflow);
    const firstCard = study.cards[0]!;

    const afterCorrect = await review.execute(study.id, firstCard.id, 'correct');
    const updated = afterCorrect.cards.find((c) => c.id === firstCard.id)!;
    expect(updated.status).toBe('learning');
    expect(updated.reviewCount).toBe(1);
    expect(updated.correctCount).toBe(1);
    expect(updated.nextReviewAt).not.toBeNull();

    const afterSecondCorrect = await review.execute(study.id, firstCard.id, 'correct');
    const learned = afterSecondCorrect.cards.find((c) => c.id === firstCard.id)!;
    expect(learned.status).toBe('learned');
    expect(learned.correctCount).toBe(2);
  });
});
