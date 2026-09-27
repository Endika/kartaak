import { createCard } from '@domain/study/entities/Card';
import { createIssue } from '@domain/study/entities/CardIssue';
import { type AIModelId, createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import { InvalidApiKeyError, NetworkError } from '@shared/errors/AppError';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAICardGeneratorClient } from '../clients/OpenAICardGeneratorClient';
import { IssueResolverRouter } from '../IssueResolverRouter';

const KEY = 'sk-test';

class InMemoryApiKeys implements IApiKeyStorage {
  get(model: AIModelId): string | null {
    return model === 'openai' ? KEY : null;
  }
  set(): void {}
  clear(): void {}
}

type ModelsAnswer = number | 'unreachable';

// Mirrors the browser: chat/completions is CORS-blocked, /v1/models answers with a readable status.
function stubOpenAI(models: ModelsAnswer): void {
  vi.stubGlobal('fetch', async (input: string) => {
    if (input.endsWith('/v1/models') && models !== 'unreachable') {
      return new Response('{}', { status: models });
    }
    throw new TypeError('Failed to fetch');
  });
}

const callers = {
  'card generator': () =>
    new OpenAICardGeneratorClient(new InMemoryApiKeys()).generate(
      createWorkflow({
        theme: 'Random',
        topics: [],
        instructions: '',
        quantity: 4,
        includeImages: false,
        aiModel: 'openai',
      }),
      4,
    ),
  'issue resolver': () =>
    new IssueResolverRouter(new InMemoryApiKeys()).resolve(
      'openai',
      createCard({ front: 'Foo', back: 'Bar' }),
      createIssue({ type: 'typo', description: 'x' }),
    ),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each(Object.entries(callers))(
  'OpenAI %s when chat/completions is unreachable',
  (_, call) => {
    it('reports an invalid key when OpenAI rejects the key', async () => {
      stubOpenAI(401);
      await expect(call()).rejects.toBeInstanceOf(InvalidApiKeyError);
    });

    it('reports a connection problem when the key is accepted', async () => {
      stubOpenAI(200);
      await expect(call()).rejects.toBeInstanceOf(NetworkError);
    });

    it('reports a connection problem when OpenAI is unreachable altogether', async () => {
      stubOpenAI('unreachable');
      await expect(call()).rejects.toBeInstanceOf(NetworkError);
    });
  },
);
