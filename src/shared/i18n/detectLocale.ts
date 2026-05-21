import { isLocale, type Locale } from './Locale';

export function detectLocale(): Locale {
  const candidates =
    typeof navigator !== 'undefined' ? [navigator.language, ...(navigator.languages ?? [])] : [];
  for (const raw of candidates) {
    const tag = raw?.toLowerCase().split('-')[0];
    if (isLocale(tag)) return tag;
  }
  return 'en';
}
