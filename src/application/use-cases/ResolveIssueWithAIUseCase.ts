import type {
  IIssueResolverService,
  IssueResolution,
} from '@domain/ai-generation/services/IIssueResolverService';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { AppError } from '@shared/errors/AppError';

export class ResolveIssueWithAIUseCase {
  constructor(
    private readonly resolver: IIssueResolverService,
    private readonly studies: IStudyRepository,
  ) {}

  async execute(studyId: string, cardId: string, issueId: string): Promise<IssueResolution> {
    const study = await this.studies.findById(studyId);
    if (!study) throw new AppError(`Study ${studyId} not found`);
    const card = study.cards.find((c) => c.id === cardId);
    if (!card) throw new AppError(`Card ${cardId} not found`);
    const issue = (card.issues ?? []).find((i) => i.id === issueId);
    if (!issue) throw new AppError(`Issue ${issueId} not found`);

    return this.resolver.resolve(study.workflow.aiModel, card, issue);
  }
}
