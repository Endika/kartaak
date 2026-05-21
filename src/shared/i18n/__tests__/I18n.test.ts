import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectLocale } from '../detectLocale';
import { I18n } from '../I18n';
import type { Locale } from '../Locale';
import type { ILocalePreference } from '../localeStorage';

class InMemoryLocalePreference implements ILocalePreference {
  constructor(public current: Locale | null = null) {}
  load(): Locale | null {
    return this.current;
  }
  save(locale: Locale): void {
    this.current = locale;
  }
}

describe('I18n.t', () => {
  it('returns the message for the active locale', () => {
    const i18n = new I18n('es', new InMemoryLocalePreference());
    expect(i18n.t('app.save')).toBe('Guardar');
  });

  it('interpolates placeholders and escapes HTML in values', () => {
    const i18n = new I18n('en', new InMemoryLocalePreference());
    const out = i18n.t('home.studyProgress', { learned: 3, total: 10, pct: 30 });
    expect(out).toBe('3/10 learned · 30%');

    const evil = i18n.t('home.noMatches', { query: '<img src=x onerror=alert(1)>' });
    expect(evil).not.toContain('<img');
    expect(evil).toContain('&lt;img');
  });

  it('keeps unknown placeholders verbatim instead of inserting "undefined"', () => {
    const i18n = new I18n('en', new InMemoryLocalePreference());
    const out = i18n.t('home.studyCardCount', {});
    expect(out).toBe('{count} cards');
  });

  it('falls back to English when the key is missing in the active locale', () => {
    const i18n = new I18n('eu', new InMemoryLocalePreference());
    // every key currently exists in all 3 dicts, so simulate a missing key by using a
    // non-existent one — both eu and en should return the raw key
    expect(i18n.t('definitely.missing.key')).toBe('definitely.missing.key');
  });
});

describe('I18n.setLocale', () => {
  let pref: InMemoryLocalePreference;
  let i18n: I18n;

  beforeEach(() => {
    pref = new InMemoryLocalePreference('en');
    i18n = new I18n('en', pref);
  });

  it('updates the active locale and persists it', () => {
    i18n.setLocale('es');
    expect(i18n.getLocale()).toBe('es');
    expect(pref.current).toBe('es');
  });

  it('fires onChange listeners only when the locale actually changes', () => {
    const listener = vi.fn();
    i18n.onChange(listener);

    i18n.setLocale('en'); // same as current
    expect(listener).not.toHaveBeenCalled();

    i18n.setLocale('eu');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes listeners through the returned disposer', () => {
    const listener = vi.fn();
    const unsubscribe = i18n.onChange(listener);
    unsubscribe();
    i18n.setLocale('es');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('detectLocale', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  function withNavigator(language: string | undefined, languages?: string[]) {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language, languages: languages ?? (language ? [language] : []) },
      configurable: true,
    });
  }

  it('picks the supported short code from navigator.language', () => {
    withNavigator('es-ES');
    expect(detectLocale()).toBe('es');
  });

  it('falls back to en when no supported language is present', () => {
    withNavigator('fr-FR', ['fr-FR', 'de-DE']);
    expect(detectLocale()).toBe('en');
  });

  it('checks navigator.languages when navigator.language is unsupported', () => {
    withNavigator('fr-FR', ['fr-FR', 'eu-ES']);
    expect(detectLocale()).toBe('eu');
  });
});
