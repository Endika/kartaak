export class AppError extends Error {
  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.cause = cause;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AIGenerationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'AIGenerationError';
  }
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

abstract class TypedAIError extends AIGenerationError {
  constructor(
    public readonly provider: AIProvider,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

export class MissingApiKeyError extends TypedAIError {
  constructor(provider: AIProvider) {
    super(provider, `Missing ${provider} API key`);
    this.name = 'MissingApiKeyError';
  }
}

export class InvalidApiKeyError extends TypedAIError {
  constructor(provider: AIProvider, cause?: unknown) {
    super(provider, `Invalid ${provider} API key`, cause);
    this.name = 'InvalidApiKeyError';
  }
}

export class RateLimitError extends TypedAIError {
  constructor(provider: AIProvider, cause?: unknown) {
    super(provider, `${provider} rate limit reached`, cause);
    this.name = 'RateLimitError';
  }
}

export class ProviderUnavailableError extends TypedAIError {
  constructor(
    provider: AIProvider,
    public readonly status: number,
    cause?: unknown,
  ) {
    super(provider, `${provider} unavailable (HTTP ${status})`, cause);
    this.name = 'ProviderUnavailableError';
  }
}

export class NetworkError extends TypedAIError {
  constructor(provider: AIProvider, cause?: unknown) {
    super(provider, `Network error reaching ${provider}`, cause);
    this.name = 'NetworkError';
  }
}

export class InvalidAIResponseError extends TypedAIError {
  constructor(provider: AIProvider, detail: string, cause?: unknown) {
    super(provider, `${provider} returned an invalid response: ${detail}`, cause);
    this.name = 'InvalidAIResponseError';
  }
}

export class EmptyAIResponseError extends TypedAIError {
  constructor(provider: AIProvider) {
    super(provider, `${provider} returned an empty response`);
    this.name = 'EmptyAIResponseError';
  }
}
