export type Locale = 'en' | 'es' | 'eu';

export const LOCALES: readonly Locale[] = ['en', 'es', 'eu'] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  eu: 'Euskara',
};

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'es' || value === 'eu';
}
