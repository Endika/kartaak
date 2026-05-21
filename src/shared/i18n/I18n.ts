import { escapeHtml } from '@shared/utils/escapeHtml';
import type { Locale } from './Locale';
import type { ILocalePreference } from './localeStorage';
import { en } from './messages/en';
import { es } from './messages/es';
import { eu } from './messages/eu';

export type Messages = Record<string, string>;

const DICTS: Record<Locale, Messages> = { en, es, eu };
const FALLBACK_LOCALE: Locale = 'en';

export type Vars = Record<string, string | number>;

export class I18n {
  private locale: Locale;
  private readonly listeners = new Set<() => void>();

  constructor(
    initial: Locale,
    private readonly preference: ILocalePreference,
  ) {
    this.locale = initial;
  }

  getLocale(): Locale {
    return this.locale;
  }

  setLocale(locale: Locale): void {
    if (locale === this.locale) return;
    this.locale = locale;
    this.preference.save(locale);
    for (const fn of this.listeners) fn();
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  t(key: string, vars?: Vars): string {
    const dict = DICTS[this.locale];
    const template = dict[key] ?? DICTS[FALLBACK_LOCALE][key] ?? key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, name) => {
      const value = vars[name];
      return value === undefined ? `{${name}}` : escapeHtml(String(value));
    });
  }
}
