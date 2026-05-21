export type SessionSize = 5 | 10 | 20 | 50 | 100 | 'all';

const STORAGE_KEY = 'kartaak.session.size';
const VALID_SIZES: readonly SessionSize[] = [5, 10, 20, 50, 100, 'all'] as const;
const DEFAULT_SIZE: SessionSize = 20;

function isSessionSize(value: unknown): value is SessionSize {
  return (VALID_SIZES as readonly unknown[]).includes(value);
}

export interface ISessionPreferenceStorage {
  load(): SessionSize;
  save(size: SessionSize): void;
}

export class LocalStorageSessionPreference implements ISessionPreferenceStorage {
  load(): SessionSize {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'all') return 'all';
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && isSessionSize(parsed)) return parsed;
    return DEFAULT_SIZE;
  }

  save(size: SessionSize): void {
    localStorage.setItem(STORAGE_KEY, String(size));
  }
}

export function sessionSizeToLimit(size: SessionSize): number | undefined {
  return size === 'all' ? undefined : size;
}

export { DEFAULT_SIZE as DEFAULT_SESSION_SIZE, VALID_SIZES as SESSION_SIZE_OPTIONS };
