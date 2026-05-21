import { createStudy, type Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { createWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { ValidationError } from '@shared/errors/AppError';
import { newId } from '@shared/utils/ids';
import type { StudyExportEnvelope } from './ExportStudyUseCase';
import { STUDY_EXPORT_FORMAT_VERSION } from './ExportStudyUseCase';

export type ImportMode = 'keep-progress' | 'fresh-copy';

export class ImportStudyUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async execute(payload: unknown, mode: ImportMode): Promise<Study> {
    const envelope = parseEnvelope(payload);
    const source = envelope.study;

    if (mode === 'fresh-copy') {
      const workflow = createWorkflow({
        theme: source.workflow.theme,
        topics: source.workflow.topics,
        instructions: source.workflow.instructions,
        quantity: Math.max(source.workflow.quantity, source.cards.length),
        includeImages: source.workflow.includeImages,
        aiModel: source.workflow.aiModel,
      });
      const resetCards = source.cards.map((c) => ({
        ...c,
        id: newId(),
        status: 'new' as const,
        reviewCount: 0,
        correctCount: 0,
        lastReviewedAt: null,
        nextReviewAt: null,
        isEdited: false,
        issues: [],
      }));
      const fresh = createStudy(workflow, resetCards);
      await this.studies.save(fresh);
      return fresh;
    }

    const study: Study = {
      ...source,
      id: newId(),
      cards: source.cards.map((c) => ({ ...c, issues: c.issues ?? [] })),
    };
    await this.studies.save(study);
    return study;
  }
}

function parseEnvelope(payload: unknown): StudyExportEnvelope {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Import payload is not a JSON object');
  }
  const obj = payload as Record<string, unknown>;
  if (obj.format !== 'kartaak.study') {
    throw new ValidationError('File is not a Kartaak study export');
  }
  if (obj.version !== STUDY_EXPORT_FORMAT_VERSION) {
    throw new ValidationError(`Unsupported export version: ${String(obj.version)}`);
  }
  const study = obj.study as Study | undefined;
  if (!study || typeof study !== 'object' || !Array.isArray(study.cards) || !study.workflow) {
    throw new ValidationError('Export envelope is missing study/cards/workflow');
  }
  return obj as unknown as StudyExportEnvelope;
}
