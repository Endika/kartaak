import {
  type AIProvider,
  InvalidApiKeyError,
  NetworkError,
  ProviderUnavailableError,
  RateLimitError,
} from '@shared/errors/AppError';

export function mapHttpError(provider: AIProvider, response: Response, body: unknown): Error {
  if (response.status === 401 || response.status === 403) {
    return new InvalidApiKeyError(provider, body);
  }
  if (response.status === 429) {
    return new RateLimitError(provider, body);
  }
  return new ProviderUnavailableError(provider, response.status, body);
}

export function mapFetchFailure(provider: AIProvider, cause: unknown): NetworkError {
  return new NetworkError(provider, cause);
}

// OpenAI's 401 on /v1/chat/completions carries no CORS header, so a wrong key reaches us as a
// fetch failure; /v1/models does send CORS headers on 401, so asking it tells the two apart.
export async function mapOpenAIFetchFailure(apiKey: string, cause: unknown): Promise<Error> {
  try {
    const probe = await fetch('https://api.openai.com/v1/models', {
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (probe.status === 401 || probe.status === 403) {
      return new InvalidApiKeyError('openai', cause);
    }
  } catch {
    // Still unreachable: a genuine connection problem.
  }
  return mapFetchFailure('openai', cause);
}

export async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
