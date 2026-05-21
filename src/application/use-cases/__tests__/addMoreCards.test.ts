import { createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { InMemoryStudyRepository } from '@infrastructure/persistence/InMemoryStudyRepository';
import { AIGenerationError } from '@shared/errors/AppError';
import { describe, expect, it } from 'vitest';
import { AddMoreCardsUseCase } from '../AddMoreCardsUseCase';
import { GenerateFullStudyUseCase } from '../GenerateFullStudyUseCase';
import { FakeCardGenerator } from './fakes';

const workflow = createWorkflow({
  theme: 'Multiplication tables',
  topics: ['7'],
  instructions: '',
  quantity: 10,
  includeImages: false,
  aiModel: 'gemini',
});

describe('AddMoreCardsUseCase', () => {
  it('appends only non-duplicate cards and reports how many duplicates were skipped', async () => {
    const repo = new InMemoryStudyRepository();
    const generator = new FakeCardGenerator();
    generator.enqueue([
      { front: '7 x 1', back: '7' },
      { front: '7 x 2', back: '14' },
    ]);
    const { study } = await new GenerateFullStudyUseCase(generator, repo).execute(workflow);

    generator.enqueue([
      { front: '7 x 1', back: '7' }, // duplicate vs existing
      { front: '7 x 3', back: '21' }, // new
      { front: '7 x 3', back: '21' }, // duplicate within batch
    ]);
    const useCase = new AddMoreCardsUseCase(generator, repo);
    const result = await useCase.execute(study.id, workflow);

    expect(result.added).toBe(1);
    expect(result.duplicatesRemoved).toBe(2);
    expect(result.study.cards.map((c) => c.front)).toEqual(['7 x 1', '7 x 2', '7 x 3']);

    const reloaded = await repo.findById(study.id);
    expect(reloaded?.cards).toHaveLength(3);
  });

  it('throws when every generated card is a duplicate of existing ones', async () => {
    const repo = new InMemoryStudyRepository();
    const generator = new FakeCardGenerator();
    generator.enqueue([{ front: '7 x 1', back: '7' }]);
    const { study } = await new GenerateFullStudyUseCase(generator, repo).execute(workflow);

    generator.enqueue([
      { front: '7 x 1', back: '7' },
      { front: '7 x 1', back: '7' },
    ]);
    const useCase = new AddMoreCardsUseCase(generator, repo);
    await expect(useCase.execute(study.id, workflow)).rejects.toBeInstanceOf(AIGenerationError);
  });

  it('throws when the generator returns an empty batch', async () => {
    const repo = new InMemoryStudyRepository();
    const generator = new FakeCardGenerator();
    generator.enqueue([{ front: '7 x 1', back: '7' }]);
    const { study } = await new GenerateFullStudyUseCase(generator, repo).execute(workflow);

    generator.enqueue([]);
    const useCase = new AddMoreCardsUseCase(generator, repo);
    await expect(useCase.execute(study.id, workflow)).rejects.toBeInstanceOf(AIGenerationError);
  });

  it('hands the existing cards to the generator so the AI can avoid them', async () => {
    const repo = new InMemoryStudyRepository();
    const generator = new FakeCardGenerator();
    generator.enqueue([
      { front: '7 x 1', back: '7' },
      { front: '7 x 2', back: '14' },
    ]);
    const { study } = await new GenerateFullStudyUseCase(generator, repo).execute(workflow);

    generator.enqueue([{ front: '7 x 3', back: '21' }]);
    const useCase = new AddMoreCardsUseCase(generator, repo);
    await useCase.execute(study.id, workflow);

    expect(generator.lastExisting).toEqual([
      { front: '7 x 1', back: '7' },
      { front: '7 x 2', back: '14' },
    ]);
  });

  it('updates the persisted workflow with the latest one passed in', async () => {
    const repo = new InMemoryStudyRepository();
    const generator = new FakeCardGenerator();
    generator.enqueue([{ front: 'a', back: 'b' }]);
    const { study } = await new GenerateFullStudyUseCase(generator, repo).execute(workflow);

    generator.enqueue([{ front: 'c', back: 'd' }]);
    const newWorkflow = createWorkflow({
      ...workflow,
      topics: ['8'],
      instructions: 'Now harder',
      aiModel: 'anthropic',
    });
    const useCase = new AddMoreCardsUseCase(generator, repo);
    const result = await useCase.execute(study.id, newWorkflow);
    expect(result.study.workflow.aiModel).toBe('anthropic');
    expect(result.study.workflow.topics).toEqual(['8']);
  });
});
