import type { Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError } from '@shared/errors/AppError';

const DB_NAME = 'kartaak';
const DB_VERSION = 1;
const STORE = 'studies';

export class IndexedDBStudyRepository implements IStudyRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new AppError('Failed to open IndexedDB', request.error));
      });
    }
    return this.dbPromise;
  }

  async save(study: Study): Promise<void> {
    const db = await this.openDb();
    await runTransaction(db, 'readwrite', (store) => store.put(study));
  }

  async findById(id: string): Promise<Study | null> {
    const db = await this.openDb();
    return runTransaction(db, 'readonly', (store) =>
      store.get(id)
    ) as Promise<Study | null>;
  }

  async findAll(): Promise<Study[]> {
    const db = await this.openDb();
    const result = await runTransaction(db, 'readonly', (store) => store.getAll());
    return (result as Study[]) ?? [];
  }

  async delete(id: string): Promise<void> {
    const db = await this.openDb();
    await runTransaction(db, 'readwrite', (store) => store.delete(id));
  }
}

function runTransaction<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest<undefined>
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const request = operation(store);
    request.onsuccess = () => resolve((request.result as T) ?? null);
    request.onerror = () => reject(new AppError('IndexedDB transaction failed', request.error));
  });
}
