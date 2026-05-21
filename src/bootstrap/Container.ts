import { AddMoreCardsUseCase } from '@application/use-cases/AddMoreCardsUseCase';
import { ApplyIssueResolutionUseCase } from '@application/use-cases/ApplyIssueResolutionUseCase';
import { DeleteCardUseCase } from '@application/use-cases/DeleteCardUseCase';
import { DeleteStudyUseCase } from '@application/use-cases/DeleteStudyUseCase';
import { EditCardUseCase } from '@application/use-cases/EditCardUseCase';
import { ExportStudyUseCase } from '@application/use-cases/ExportStudyUseCase';
import { GenerateCardPreviewUseCase } from '@application/use-cases/GenerateCardPreviewUseCase';
import { GenerateFullStudyUseCase } from '@application/use-cases/GenerateFullStudyUseCase';
import { ImportStudyUseCase } from '@application/use-cases/ImportStudyUseCase';
import { MarkCardIssueUseCase } from '@application/use-cases/MarkCardIssueUseCase';
import { RenameStudyUseCase } from '@application/use-cases/RenameStudyUseCase';
import { ResolveIssueWithAIUseCase } from '@application/use-cases/ResolveIssueWithAIUseCase';
import { ReviewCardUseCase } from '@application/use-cases/ReviewCardUseCase';
import { UpdateIssueStatusUseCase } from '@application/use-cases/UpdateIssueStatusUseCase';
import { CardGeneratorRouter } from '@infrastructure/ai/CardGeneratorRouter';
import { AnthropicCardGeneratorClient } from '@infrastructure/ai/clients/AnthropicCardGeneratorClient';
import { GeminiCardGeneratorClient } from '@infrastructure/ai/clients/GeminiCardGeneratorClient';
import { OpenAICardGeneratorClient } from '@infrastructure/ai/clients/OpenAICardGeneratorClient';
import { IssueResolverRouter } from '@infrastructure/ai/IssueResolverRouter';
import { IndexedDBStudyRepository } from '@infrastructure/persistence/indexeddb/IndexedDBStudyRepository';
import { LocalStorageApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import { detectLocale, I18n, LocalStorageLocalePreference } from '@shared/i18n';

export class Container {
  readonly apiKeys = new LocalStorageApiKeyStorage();
  readonly localePreference = new LocalStorageLocalePreference();
  readonly i18n = new I18n(this.localePreference.load() ?? detectLocale(), this.localePreference);
  readonly studies = new IndexedDBStudyRepository();
  readonly generator = new CardGeneratorRouter({
    gemini: new GeminiCardGeneratorClient(this.apiKeys),
    openai: new OpenAICardGeneratorClient(this.apiKeys),
    anthropic: new AnthropicCardGeneratorClient(this.apiKeys),
  });
  readonly issueResolver = new IssueResolverRouter(this.apiKeys);

  readonly generatePreview = new GenerateCardPreviewUseCase(this.generator);
  readonly generateFullStudy = new GenerateFullStudyUseCase(this.generator, this.studies);
  readonly addMoreCards = new AddMoreCardsUseCase(this.generator, this.studies);
  readonly reviewCard = new ReviewCardUseCase(this.studies);
  readonly editCard = new EditCardUseCase(this.studies);
  readonly markCardIssue = new MarkCardIssueUseCase(this.studies);
  readonly updateIssueStatus = new UpdateIssueStatusUseCase(this.studies);
  readonly resolveIssueWithAI = new ResolveIssueWithAIUseCase(this.issueResolver, this.studies);
  readonly applyIssueResolution = new ApplyIssueResolutionUseCase(this.studies);
  readonly deleteCard = new DeleteCardUseCase(this.studies);
  readonly deleteStudy = new DeleteStudyUseCase(this.studies);
  readonly renameStudy = new RenameStudyUseCase(this.studies);
  readonly exportStudy = new ExportStudyUseCase(this.studies);
  readonly importStudy = new ImportStudyUseCase(this.studies);
}
