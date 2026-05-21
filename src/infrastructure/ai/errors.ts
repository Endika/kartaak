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

export async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
