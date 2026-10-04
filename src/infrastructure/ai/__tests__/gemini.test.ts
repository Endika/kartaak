import { createCard } from '@domain/study/entities/Card';
import { createIssue } from '@domain/study/entities/CardIssue';
import { type AIModelId, createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeminiCardGeneratorClient } from '../clients/GeminiCardGeneratorClient';
import { IssueResolverRouter } from '../IssueResolverRouter';

// AI Studio auth key format since 2026-05-28: "AQ." prefix, 53 characters.
const AQ_KEY = `AQ.${'Ab1-_x'.repeat(8)}zz`;

class InMemoryApiKeys implements IApiKeyStorage {
  constructor(private readonly key: string) {}
  get(model: AIModelId): string | null {
    return model === 'gemini' ? this.key : null;
  }
  set(): void {}
  clear(): void {}
}

interface Answer {
  status: number;
  body: unknown;
}

const requests: URL[] = [];

function stubGemini(answer: Answer): void {
  vi.stubGlobal('fetch', async (input: string) => {
    requests.push(new URL(input));
    return new Response(JSON.stringify(answer.body), { status: answer.status });
  });
}

function geminiText(text: string): Answer {
  return { status: 200, body: { candidates: [{ content: { parts: [{ text }] } }] } };
}

const CARDS = JSON.stringify([{ front: 'Hola', back: 'Hello' }]);
const RESOLUTION = JSON.stringify({ front: 'Foo', back: 'Bar' });

const callers = {
  'card generator': {
    ok: CARDS,
    call: (key: string) =>
      new GeminiCardGeneratorClient(new InMemoryApiKeys(key)).generate(
        createWorkflow({
          theme: 'Spanish',
          topics: [],
          instructions: '',
          quantity: 4,
          includeImages: false,
          aiModel: 'gemini',
        }),
        4,
      ),
  },
  'issue resolver': {
    ok: RESOLUTION,
    call: (key: string) =>
      new IssueResolverRouter(new InMemoryApiKeys(key)).resolve(
        'gemini',
        createCard({ front: 'Foo', back: 'Baz' }),
        createIssue({ type: 'typo', description: 'x' }),
      ),
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  requests.length = 0;
});

describe.each(Object.entries(callers))('Gemini %s', (_, { ok, call }) => {
  it('asks gemini-3.1-flash-lite', async () => {
    stubGemini(geminiText(ok));
    await call(AQ_KEY);
    expect(requests[0]?.pathname).toBe('/v1beta/models/gemini-3.1-flash-lite:generateContent');
  });

  it('sends a 53-character AQ. key exactly as stored', async () => {
    expect(AQ_KEY).toHaveLength(53);
    stubGemini(geminiText(ok));
    await call(AQ_KEY);
    expect(requests[0]?.searchParams.get('key')).toBe(AQ_KEY);
  });
});
