import {
  AIGenerationError,
  EmptyAIResponseError,
  InvalidAIResponseError,
  InvalidApiKeyError,
  MissingApiKeyError,
  NetworkError,
  ProviderUnavailableError,
  RateLimitError,
} from '@shared/errors/AppError';
import type { I18n } from '@shared/i18n';

export function aiErrorMessage(err: unknown, i18n: I18n, fallbackKey: string): string {
  if (err instanceof MissingApiKeyError) {
    return i18n.t('error.ai.missingKey', { provider: err.provider });
  }
  if (err instanceof InvalidApiKeyError) {
    return i18n.t('error.ai.invalidKey', { provider: err.provider });
  }
  if (err instanceof RateLimitError) {
    return i18n.t('error.ai.rateLimit', { provider: err.provider });
  }
  if (err instanceof ProviderUnavailableError) {
    return i18n.t('error.ai.providerUnavailable', { provider: err.provider, status: err.status });
  }
  if (err instanceof NetworkError) {
    return i18n.t('error.ai.network', { provider: err.provider });
  }
  if (err instanceof InvalidAIResponseError) {
    return i18n.t('error.ai.invalidResponse', { provider: err.provider });
  }
  if (err instanceof EmptyAIResponseError) {
    return i18n.t('error.ai.empty', { provider: err.provider });
  }
  if (err instanceof AIGenerationError) {
    if (/duplicates/i.test(err.message)) return i18n.t('error.ai.allDuplicates');
    if (/no cards/i.test(err.message) || /returned no cards/i.test(err.message)) {
      return i18n.t('error.ai.noCards');
    }
  }
  return err instanceof Error ? err.message : i18n.t(fallbackKey);
}
