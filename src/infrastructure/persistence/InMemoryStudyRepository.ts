import type { Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';

export class InMemoryStudyRepository implements IStudyRepository {
  private readonly store = new Map<string, Study>();

  async save(study: Study): Promise<void> {
    this.store.set(study.id, structuredClone(study));
  }

  async findById(id: string): Promise<Study | null> {
    const found = this.store.get(id);
    return found ? structuredClone(found) : null;
  }

  async findAll(): Promise<Study[]> {
    return Array.from(this.store.values()).map((s) => structuredClone(s));
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
