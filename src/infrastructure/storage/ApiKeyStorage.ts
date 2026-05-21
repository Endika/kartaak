import type { AIModelId } from '@domain/study/value-objects/StudyWorkflow';

const STORAGE_KEY_PREFIX = 'kartaak.api-key.';

export interface IApiKeyStorage {
  get(model: AIModelId): string | null;
  set(model: AIModelId, key: string): void;
  clear(model: AIModelId): void;
}

export class LocalStorageApiKeyStorage implements IApiKeyStorage {
  get(model: AIModelId): string | null {
    return localStorage.getItem(STORAGE_KEY_PREFIX + model);
  }

  set(model: AIModelId, key: string): void {
    const trimmed = key.trim();
    if (!trimmed) {
      this.clear(model);
      return;
    }
    localStorage.setItem(STORAGE_KEY_PREFIX + model, trimmed);
  }

  clear(model: AIModelId): void {
    localStorage.removeItem(STORAGE_KEY_PREFIX + model);
  }
}
