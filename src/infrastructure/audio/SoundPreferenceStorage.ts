const STORAGE_KEY = 'kartaak.sounds.enabled';

export interface ISoundPreferenceStorage {
  load(): boolean;
  save(enabled: boolean): void;
}

export class LocalStorageSoundPreference implements ISoundPreferenceStorage {
  load(): boolean {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === '0' || raw === 'false') return false;
    return true;
  }

  save(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  }
}
