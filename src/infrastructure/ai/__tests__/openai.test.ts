import { createCard } from '@domain/study/entities/Card';
import { createIssue } from '@domain/study/entities/CardIssue';
import { type AIModelId, createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAICardGeneratorClient } from '../clients/OpenAICardGeneratorClient';
import { IssueResolverRouter } from '../IssueResolverRouter';

class InMemoryApiKeys implements IApiKeyStorage {
  get(model: AIModelId): string | null {
    return model === 'openai' ? 'sk-test' : null;
  }
  set(): void {}
  clear(): void {}
}

const bodies: Record<string, unknown>[] = [];

function stubOpenAI(content: string): void {
  vi.stubGlobal('fetch', async (_input: string, init: RequestInit) => {
    bodies.push(JSON.parse(init.body as string) as Record<string, unknown>);
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
  });
}

const callers = {
  'card generator': {
    ok: JSON.stringify({ cards: [{ front: 'Hola', back: 'Hello' }] }),
    call: () =>
      new OpenAICardGeneratorClient(new InMemoryApiKeys()).generate(
        createWorkflow({
          theme: 'Spanish',
          topics: [],
          instructions: '',
          quantity: 4,
          includeImages: false,
          aiModel: 'openai',
        }),
        4,
      ),
  },
  'issue resolver': {
    ok: JSON.stringify({ front: 'Foo', back: 'Bar' }),
    call: () =>
      new IssueResolverRouter(new InMemoryApiKeys()).resolve(
        'openai',
        createCard({ front: 'Foo', back: 'Baz' }),
        createIssue({ type: 'typo', description: 'x' }),
      ),
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  bodies.length = 0;
});

describe.each(Object.entries(callers))('OpenAI %s', (_, { ok, call }) => {
  it('asks gpt-6-luna with reasoning off', async () => {
    stubOpenAI(ok);
    await call();
    expect(bodies[0]?.model).toBe('gpt-6-luna');
    expect(bodies[0]?.reasoning_effort).toBe('none');
  });

  it('sends no max_tokens, which reasoning models reject', async () => {
    stubOpenAI(ok);
    await call();
    expect(bodies[0]).not.toHaveProperty('max_tokens');
  });
});
