import { GeminiAccessError, type GeminiAccessReason } from '@shared/errors/AppError';
import { I18n, type ILocalePreference, LOCALES, type Locale } from '@shared/i18n';
import { describe, expect, it } from 'vitest';
import { aiErrorMessage } from '../aiErrorMessage';

class NoPreference implements ILocalePreference {
  load(): Locale | null {
    return null;
  }
  save(): void {}
}

const REASONS: GeminiAccessReason[] = [
  'serviceBlocked',
  'serviceDisabled',
  'billingDisabled',
  'keyRestricted',
];

describe.each(LOCALES)('aiErrorMessage for Gemini access errors (%s)', (locale) => {
  const i18n = new I18n(locale, new NoPreference());
  const messages = REASONS.map((reason) =>
    aiErrorMessage(new GeminiAccessError(reason), i18n, 'app.somethingWentWrong'),
  );

  it('gives each cause its own translated message', () => {
    for (const message of messages) {
      expect(message).not.toMatch(/^error\.ai\./);
      expect(message).not.toBe(i18n.t('app.somethingWentWrong'));
    }
    expect(new Set(messages).size).toBe(REASONS.length);
  });

  it('points to the Google Cloud console where the fix lives', () => {
    const [blocked, disabled, billing, restricted] = messages;
    expect(blocked).toContain('aistudio.google.com/app/apikey');
    expect(disabled).toContain('console.cloud.google.com/apis/library/generativelanguage');
    expect(billing).toContain('console.cloud.google.com/billing');
    expect(restricted).toContain('console.cloud.google.com/apis/credentials');
  });
});
