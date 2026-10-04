import { createCard } from '@domain/study/entities/Card';
import { createIssue } from '@domain/study/entities/CardIssue';
import { type AIModelId, createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import {
  GeminiAccessError,
  InvalidApiKeyError,
  ProviderUnavailableError,
} from '@shared/errors/AppError';
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

function googleError(status: number, reason?: string): Answer {
  return {
    status,
    body: {
      error: {
        code: status,
        message: 'irrelevant',
        status: status === 400 ? 'INVALID_ARGUMENT' : 'PERMISSION_DENIED',
        details: reason
          ? [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason, domain: 'x' }]
          : [],
      },
    },
  };
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

  it('reports an invalid key when Google answers 400 API_KEY_INVALID', async () => {
    stubGemini(googleError(400, 'API_KEY_INVALID'));
    await expect(call(AQ_KEY)).rejects.toBeInstanceOf(InvalidApiKeyError);
  });

  it.each([
    ['API_KEY_SERVICE_BLOCKED', 'serviceBlocked'],
    ['SERVICE_DISABLED', 'serviceDisabled'],
    ['BILLING_DISABLED', 'billingDisabled'],
    ['API_KEY_HTTP_REFERRER_BLOCKED', 'keyRestricted'],
    ['API_KEY_IP_ADDRESS_BLOCKED', 'keyRestricted'],
  ])('names the cause when Google answers 403 %s', async (reason, expected) => {
    stubGemini(googleError(403, reason));
    const err = await call(AQ_KEY).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GeminiAccessError);
    expect((err as GeminiAccessError).reason).toBe(expected);
  });

  it('still reports a rejected key on a 403 without a known reason', async () => {
    stubGemini(googleError(403));
    await expect(call(AQ_KEY)).rejects.toBeInstanceOf(InvalidApiKeyError);
  });

  it('keeps reporting other 400s as the provider failing', async () => {
    stubGemini(googleError(400));
    await expect(call(AQ_KEY)).rejects.toBeInstanceOf(ProviderUnavailableError);
  });
});
