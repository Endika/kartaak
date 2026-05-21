import { isLocale, type Locale } from './Locale';

const STORAGE_KEY = 'kartaak.locale';

export interface ILocalePreference {
  load(): Locale | null;
  save(locale: Locale): void;
}

export class LocalStorageLocalePreference implements ILocalePreference {
  load(): Locale | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isLocale(raw) ? raw : null;
  }

  save(locale: Locale): void {
    localStorage.setItem(STORAGE_KEY, locale);
  }
}
