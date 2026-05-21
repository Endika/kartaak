import type { AddMoreCardsUseCase } from '@application/use-cases/AddMoreCardsUseCase';
import type { GenerateCardPreviewUseCase } from '@application/use-cases/GenerateCardPreviewUseCase';
import type { Card } from '@domain/study/entities/Card';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import type { I18n } from '@shared/i18n';
import type { PageContext } from '../AppRouter';
import { appShell } from '../components/Layout';
import type { Draft } from './add-more-cards/draft';
import { paintForm } from './add-more-cards/formView';
import { paintPreview } from './add-more-cards/previewView';

export interface AddMoreCardsPageDeps {
  studies: IStudyRepository;
  apiKeys: IApiKeyStorage;
  generatePreview: GenerateCardPreviewUseCase;
  addMoreCards: AddMoreCardsUseCase;
  i18n: I18n;
}

type Ctx = PageContext<AddMoreCardsPageDeps>;

export async function renderAddMoreCardsPage(
  root: HTMLElement,
  ctx: Ctx,
  studyId: string,
): Promise<void> {
  const { i18n } = ctx.deps;
  const study = await ctx.deps.studies.findById(studyId);
  if (!study) {
    root.innerHTML = appShell(
      `<p class="text-sm text-slate-500">${i18n.t('addMore.notFound')}</p>`,
      { back: { label: i18n.t('addMore.backHome'), onBackId: 'back-home' } },
    );
    root.querySelector('#back-home')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'home' });
    });
    return;
  }

  let draft: Draft = {
    topicsRaw: study.workflow.topics.join(', '),
    instructions: study.workflow.instructions,
    quantity: Math.max(study.workflow.quantity, 50),
    aiModel: study.workflow.aiModel,
  };
  let previewCards: Card[] | null = null;

  const showForm = (): void => {
    paintForm(
      root,
      study,
      draft,
      { apiKeys: ctx.deps.apiKeys, generatePreview: ctx.deps.generatePreview, i18n },
      {
        onBack: () => ctx.router.navigate({ type: 'study-detail', studyId }),
        onPreviewReady: (cards, nextDraft) => {
          draft = nextDraft;
          previewCards = cards;
          showPreview();
        },
      },
    );
  };

  const showPreview = (): void => {
    if (!previewCards) return;
    paintPreview(
      root,
      study,
      previewCards,
      draft,
      { generatePreview: ctx.deps.generatePreview, addMoreCards: ctx.deps.addMoreCards, i18n },
      {
        onBackToDetail: () => ctx.router.navigate({ type: 'study-detail', studyId }),
        onBackToForm: () => {
          previewCards = null;
          showForm();
        },
        onRegenerated: (next) => {
          previewCards = next;
          showPreview();
        },
        onAdded: (updatedStudyId) =>
          ctx.router.navigate({ type: 'study-detail', studyId: updatedStudyId }),
      },
    );
  };

  showForm();
}
