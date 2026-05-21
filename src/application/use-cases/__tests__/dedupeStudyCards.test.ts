import { applyReview, createCard } from '@domain/study/entities/Card';
import { createStudy } from '@domain/study/entities/Study';
import { createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { InMemoryStudyRepository } from '@infrastructure/persistence/InMemoryStudyRepository';
import { describe, expect, it } from 'vitest';
import { DedupeStudyCardsUseCase } from '../DedupeStudyCardsUseCase';

function aStudyWith(cards: ReturnType<typeof createCard>[]) {
  const workflow = createWorkflow({
    theme: 'Whatever',
    topics: [],
    instructions: '',
    quantity: 10,
    includeImages: false,
    aiModel: 'gemini',
  });
  return createStudy(workflow, cards);
}

describe('DedupeStudyCardsUseCase', () => {
  it('preview reports the number of duplicates to remove without writing', async () => {
    const repo = new InMemoryStudyRepository();
    const a = createCard({ front: 'Capital of France', back: 'Paris' });
    const b = createCard({ front: 'Capital of France?', back: 'París' });
    const c = createCard({ front: 'Capital of Spain', back: 'Madrid' });
    const study = aStudyWith([a, b, c]);
    await repo.save(study);

    const useCase = new DedupeStudyCardsUseCase(repo);
    const preview = await useCase.preview(study.id);
    expect(preview).toEqual({ totalCards: 3, uniqueGroups: 2, duplicatesToRemove: 1 });

    const reloaded = await repo.findById(study.id);
    expect(reloaded?.cards).toHaveLength(3);
  });

  it('keeps the most-reviewed card and drops the rest of each group', async () => {
    const repo = new InMemoryStudyRepository();
    const original = createCard({ front: 'Capital of France', back: 'Paris' });
    const reviewed = applyReview(applyReview(original, 'correct'), 'correct');
    const dup = createCard({ front: 'Capital of France?', back: 'París' });
    const unique = createCard({ front: 'Capital of Spain', back: 'Madrid' });
    const study = aStudyWith([dup, reviewed, unique]);
    await repo.save(study);

    const useCase = new DedupeStudyCardsUseCase(repo);
    const result = await useCase.execute(study.id);

    expect(result.removed).toBe(1);
    expect(result.groupsCollapsed).toBe(1);
    expect(result.study.cards).toHaveLength(2);
    const kept = result.study.cards.find((c) => c.back === 'Paris');
    expect(kept?.reviewCount).toBe(2);

    const persisted = await repo.findById(study.id);
    expect(persisted?.cards).toHaveLength(2);
  });

  it('falls back to earliest createdAt when review counts tie', async () => {
    const repo = new InMemoryStudyRepository();
    const older = { ...createCard({ front: 'a', back: 'b' }), createdAt: '2026-01-01T00:00:00Z' };
    const newer = { ...createCard({ front: 'A', back: 'B' }), createdAt: '2026-05-01T00:00:00Z' };
    const study = aStudyWith([newer, older]);
    await repo.save(study);

    const result = await new DedupeStudyCardsUseCase(repo).execute(study.id);
    expect(result.study.cards).toHaveLength(1);
    expect(result.study.cards[0]?.createdAt).toBe('2026-01-01T00:00:00Z');
  });

  it('is a no-op when there are no duplicates', async () => {
    const repo = new InMemoryStudyRepository();
    const study = aStudyWith([
      createCard({ front: 'a', back: 'a' }),
      createCard({ front: 'b', back: 'b' }),
    ]);
    await repo.save(study);

    const before = await repo.findById(study.id);
    const result = await new DedupeStudyCardsUseCase(repo).execute(study.id);
    expect(result.removed).toBe(0);
    expect(result.groupsCollapsed).toBe(0);

    const after = await repo.findById(study.id);
    expect(after?.lastUpdatedAt).toBe(before?.lastUpdatedAt);
  });
});
