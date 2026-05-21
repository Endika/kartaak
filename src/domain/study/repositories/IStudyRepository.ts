import type { Study } from '../entities/Study';

export interface IStudyRepository {
  save(study: Study): Promise<void>;
  findById(id: string): Promise<Study | null>;
  findAll(): Promise<Study[]>;
  delete(id: string): Promise<void>;
}
