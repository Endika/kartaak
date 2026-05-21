import { createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { InMemoryStudyRepository } from '@infrastructure/persistence/InMemoryStudyRepository';
import { ValidationError } from '@shared/errors/AppError';
import { describe, expect, it } from 'vitest';
import { EditCardUseCase } from '../EditCardUseCase';
import { GenerateFullStudyUseCase } from '../GenerateFullStudyUseCase';
import { RenameStudyUseCase } from '../RenameStudyUseCase';
import { FakeCardGenerator } from './fakes';

async function seed() {
  const repo = new InMemoryStudyRepository();
  const generator = new FakeCardGenerator();
  generator.enqueue([{ front: 'Front', back: 'Back' }]);
  const workflow = createWorkflow({
    theme: 'Whatever',
    topics: [],
    instructions: '',
    quantity: 4,
    includeImages: false,
    aiModel: 'gemini',
  });
  const { study } = await new GenerateFullStudyUseCase(generator, repo).execute(workflow);
  return { repo, study };
}

describe('EditCardUseCase', () => {
  it('updates content, marks the card as edited and persists it', async () => {
    const { repo, study } = await seed();
    const useCase = new EditCardUseCase(repo);
    const updated = await useCase.execute(study.id, study.cards[0]!.id, 'New front', 'New back');
    expect(updated.cards[0]?.front).toBe('New front');
    expect(updated.cards[0]?.isEdited).toBe(true);

    const reloaded = await repo.findById(study.id);
    expect(reloaded?.cards[0]?.front).toBe('New front');
    expect(reloaded?.cards[0]?.isEdited).toBe(true);
  });

  it('rejects empty front or back', async () => {
    const { repo, study } = await seed();
    const useCase = new EditCardUseCase(repo);
    await expect(
      useCase.execute(study.id, study.cards[0]!.id, '   ', 'back'),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(useCase.execute(study.id, study.cards[0]!.id, 'front', '')).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe('RenameStudyUseCase', () => {
  it('renames the study, trims whitespace and persists', async () => {
    const { repo, study } = await seed();
    const useCase = new RenameStudyUseCase(repo);
    const renamed = await useCase.execute(study.id, '  My new name  ');
    expect(renamed.name).toBe('My new name');

    const reloaded = await repo.findById(study.id);
    expect(reloaded?.name).toBe('My new name');
  });

  it('rejects empty names', async () => {
    const { repo, study } = await seed();
    const useCase = new RenameStudyUseCase(repo);
    await expect(useCase.execute(study.id, '   ')).rejects.toBeInstanceOf(ValidationError);
  });
});
