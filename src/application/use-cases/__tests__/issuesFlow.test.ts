import type { IIssueResolverService } from '@domain/ai-generation/services/IIssueResolverService';
import { createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { InMemoryStudyRepository } from '@infrastructure/persistence/InMemoryStudyRepository';
import { ValidationError } from '@shared/errors/AppError';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplyIssueResolutionUseCase } from '../ApplyIssueResolutionUseCase';
import { GenerateFullStudyUseCase } from '../GenerateFullStudyUseCase';
import { MarkCardIssueUseCase } from '../MarkCardIssueUseCase';
import { ResolveIssueWithAIUseCase } from '../ResolveIssueWithAIUseCase';
import { UpdateIssueStatusUseCase } from '../UpdateIssueStatusUseCase';
import { FakeCardGenerator } from './fakes';

class FakeIssueResolver implements IIssueResolverService {
  public lastModel: string | null = null;
  async resolve(model: string) {
    this.lastModel = model;
    return {
      proposedFront: 'Better front',
      proposedBack: 'Better back',
      rationale: 'Clearer wording',
    };
  }
}

async function seedStudyWithOneCard() {
  const repo = new InMemoryStudyRepository();
  const generator = new FakeCardGenerator();
  generator.enqueue([{ front: 'Foo', back: 'Bar' }]);
  const workflow = createWorkflow({
    theme: 'Random',
    topics: [],
    instructions: '',
    quantity: 4,
    includeImages: false,
    aiModel: 'gemini',
  });
  const { study } = await new GenerateFullStudyUseCase(generator, repo).execute(workflow);
  return { repo, study, card: study.cards[0]! };
}

describe('full issue lifecycle', () => {
  it('mark → AI proposal → apply persists the resolution and closes the issue', async () => {
    const { repo, study, card } = await seedStudyWithOneCard();

    const mark = new MarkCardIssueUseCase(repo);
    const { study: afterMark, issue } = await mark.execute(
      study.id,
      card.id,
      'typo',
      'Typo on the back',
    );

    expect(afterMark.cards[0]?.issues).toHaveLength(1);
    expect(issue.status).toBe('pending');

    const resolver = new FakeIssueResolver();
    const ai = new ResolveIssueWithAIUseCase(resolver, repo);
    const resolution = await ai.execute(study.id, card.id, issue.id);
    expect(resolver.lastModel).toBe('gemini');
    expect(resolution.proposedFront).toBe('Better front');

    const apply = new ApplyIssueResolutionUseCase(repo);
    const final = await apply.execute(
      study.id,
      card.id,
      issue.id,
      resolution.proposedFront,
      resolution.proposedBack,
    );

    const persisted = final.cards[0]!;
    expect(persisted.front).toBe('Better front');
    expect(persisted.back).toBe('Better back');
    expect(persisted.isEdited).toBe(true);
    expect(persisted.issues?.[0]?.status).toBe('resolved');
  });

  it('dismiss leaves the card content untouched and marks the issue dismissed', async () => {
    const { repo, study, card } = await seedStudyWithOneCard();
    const mark = new MarkCardIssueUseCase(repo);
    const { issue } = await mark.execute(study.id, card.id, 'confusing', 'Unclear question');

    const update = new UpdateIssueStatusUseCase(repo);
    const after = await update.execute(study.id, card.id, issue.id, 'dismiss');

    expect(after.cards[0]?.front).toBe('Foo');
    expect(after.cards[0]?.back).toBe('Bar');
    expect(after.cards[0]?.issues?.[0]?.status).toBe('dismissed');
    expect(after.cards[0]?.isEdited).toBe(false);
  });

  it('refuses to mark an "other" issue without a description', async () => {
    const { repo, study, card } = await seedStudyWithOneCard();
    const mark = new MarkCardIssueUseCase(repo);
    await expect(mark.execute(study.id, card.id, 'other', '  ')).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('refuses to apply a resolution with an empty side', async () => {
    const { repo, study, card } = await seedStudyWithOneCard();
    const mark = new MarkCardIssueUseCase(repo);
    const { issue } = await mark.execute(study.id, card.id, 'typo', 'fix');

    const apply = new ApplyIssueResolutionUseCase(repo);
    await expect(
      apply.execute(study.id, card.id, issue.id, '', 'Back only'),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('basic guards', () => {
  beforeEach(() => {
    // no shared state
  });

  it('all issue use cases reject unknown studies and cards', async () => {
    const repo = new InMemoryStudyRepository();
    const mark = new MarkCardIssueUseCase(repo);
    await expect(mark.execute('nope', 'nope', 'typo', 'x')).rejects.toThrow();

    const { study, card } = await seedStudyWithOneCard();
    const update = new UpdateIssueStatusUseCase(new InMemoryStudyRepository());
    await expect(update.execute(study.id, card.id, 'x', 'resolve')).rejects.toThrow();
  });
});
