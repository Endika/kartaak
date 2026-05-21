import { createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { InMemoryStudyRepository } from '@infrastructure/persistence/InMemoryStudyRepository';
import { ValidationError } from '@shared/errors/AppError';
import { describe, expect, it } from 'vitest';
import { ExportStudyUseCase } from '../ExportStudyUseCase';
import { GenerateFullStudyUseCase } from '../GenerateFullStudyUseCase';
import { ImportStudyUseCase } from '../ImportStudyUseCase';
import { ReviewCardUseCase } from '../ReviewCardUseCase';
import { FakeCardGenerator } from './fakes';

async function seedStudyWithProgress() {
  const repo = new InMemoryStudyRepository();
  const generator = new FakeCardGenerator();
  generator.enqueue([
    { front: 'a', back: 'b' },
    { front: 'c', back: 'd' },
  ]);
  const workflow = createWorkflow({
    theme: 'Geography',
    topics: ['Europe'],
    instructions: '',
    quantity: 4,
    includeImages: false,
    aiModel: 'gemini',
  });
  const { study } = await new GenerateFullStudyUseCase(generator, repo).execute(workflow);
  await new ReviewCardUseCase(repo).execute(study.id, study.cards[0]!.id, 'correct');
  return { repo, study };
}

describe('export → import roundtrip', () => {
  it('fresh-copy resets all card progress and assigns new ids', async () => {
    const { repo, study } = await seedStudyWithProgress();
    const envelope = await new ExportStudyUseCase(repo).execute(study.id);

    const targetRepo = new InMemoryStudyRepository();
    const imported = await new ImportStudyUseCase(targetRepo).execute(envelope, 'fresh-copy');

    expect(imported.id).not.toBe(study.id);
    expect(imported.cards).toHaveLength(2);
    expect(imported.cards.every((c) => c.status === 'new')).toBe(true);
    expect(imported.cards.every((c) => c.reviewCount === 0)).toBe(true);
    expect(imported.cards.every((c) => c.lastReviewedAt === null)).toBe(true);
    expect(
      imported.cards.every((c) => c.id !== study.cards.find((s) => s.front === c.front)?.id),
    ).toBe(true);
    expect(imported.workflow.theme).toBe(study.workflow.theme);
  });

  it('keep-progress preserves card status and counters but assigns a new study id', async () => {
    const { repo, study } = await seedStudyWithProgress();
    const envelope = await new ExportStudyUseCase(repo).execute(study.id);
    const original = await repo.findById(study.id);
    if (!original) throw new Error('Seeded study disappeared from the repo');

    const targetRepo = new InMemoryStudyRepository();
    const imported = await new ImportStudyUseCase(targetRepo).execute(envelope, 'keep-progress');

    expect(imported.id).not.toBe(study.id);
    expect(imported.cards).toHaveLength(original.cards.length);
    const reviewedSource = original.cards.find((c) => c.reviewCount > 0);
    const reviewedTarget = imported.cards.find((c) => c.front === reviewedSource?.front);
    expect(reviewedTarget?.reviewCount).toBe(reviewedSource?.reviewCount);
    expect(reviewedTarget?.status).toBe(reviewedSource?.status);
  });
});

describe('ImportStudyUseCase rejects bad payloads', () => {
  it('rejects non-object payloads', async () => {
    const repo = new InMemoryStudyRepository();
    const useCase = new ImportStudyUseCase(repo);
    await expect(useCase.execute(null, 'fresh-copy')).rejects.toBeInstanceOf(ValidationError);
    await expect(useCase.execute('a string', 'fresh-copy')).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects payloads with the wrong format marker', async () => {
    const repo = new InMemoryStudyRepository();
    const useCase = new ImportStudyUseCase(repo);
    await expect(
      useCase.execute({ format: 'not-kartaak', version: 1, study: {} }, 'fresh-copy'),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects payloads with an unsupported version', async () => {
    const repo = new InMemoryStudyRepository();
    const useCase = new ImportStudyUseCase(repo);
    await expect(
      useCase.execute({ format: 'kartaak.study', version: 999, study: {} }, 'fresh-copy'),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
