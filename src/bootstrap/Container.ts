import { GenerateCardPreviewUseCase } from '@application/use-cases/GenerateCardPreviewUseCase';
import { GenerateFullStudyUseCase } from '@application/use-cases/GenerateFullStudyUseCase';
import { ReviewCardUseCase } from '@application/use-cases/ReviewCardUseCase';
import { GeminiCardGeneratorClient } from '@infrastructure/ai/clients/GeminiCardGeneratorClient';
import { IndexedDBStudyRepository } from '@infrastructure/persistence/indexeddb/IndexedDBStudyRepository';
import { LocalStorageApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';

export class Container {
  readonly apiKeys = new LocalStorageApiKeyStorage();
  readonly studies = new IndexedDBStudyRepository();
  readonly generator = new GeminiCardGeneratorClient(this.apiKeys);

  readonly generatePreview = new GenerateCardPreviewUseCase(this.generator);
  readonly generateFullStudy = new GenerateFullStudyUseCase(this.generator, this.studies);
  readonly reviewCard = new ReviewCardUseCase(this.studies);
}
