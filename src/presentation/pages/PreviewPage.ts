import type { GenerateCardPreviewUseCase } from '@application/use-cases/GenerateCardPreviewUseCase';
import type { GenerateFullStudyUseCase } from '@application/use-cases/GenerateFullStudyUseCase';
import type { Card } from '@domain/study/entities/Card';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type { I18n } from '@shared/i18n';
import type { PageContext } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';

export interface PreviewPageDeps {
  generatePreview: GenerateCardPreviewUseCase;
  generateFullStudy: GenerateFullStudyUseCase;
  i18n: I18n;
}

type Ctx = PageContext<PreviewPageDeps>;

export function renderPreviewPage(
  root: HTMLElement,
  ctx: Ctx,
  workflow: StudyWorkflow,
  previewCards: Card[],
): void {
  const { i18n } = ctx.deps;
  const summary =
    workflow.topics.length > 0
      ? i18n.t('preview.summaryWithTopics', {
          theme: workflow.theme,
          topics: workflow.topics.join(', '),
          quantity: workflow.quantity,
          model: workflow.aiModel,
        })
      : i18n.t('preview.summary', {
          theme: workflow.theme,
          quantity: workflow.quantity,
          model: workflow.aiModel,
        });

  root.innerHTML = appShell(
    `
    <h1 class="text-2xl font-bold mb-1">${i18n.t('preview.title')}</h1>
    <p class="text-sm text-slate-500 mb-1">${i18n.t('preview.subtitle', { count: previewCards.length })}</p>
    <p class="text-xs text-slate-400 mb-6">${summary}</p>

    <ul class="space-y-3 mb-8">
      ${previewCards.map((c) => previewCardItem(c, i18n)).join('')}
    </ul>

    <div id="generate-error" class="hidden mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"></div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <button id="back-to-form" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">${i18n.t('preview.editWorkflow')}</button>
      <div class="flex gap-2">
        <button id="regenerate" class="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition">${i18n.t('preview.regenerate')}</button>
        <button id="generate-all" class="px-5 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-50">
          ${i18n.t('preview.generateAll', { count: workflow.quantity })}
        </button>
      </div>
    </div>
  `,
    { back: { label: i18n.t('preview.back'), onBackId: 'back-home' } },
  );

  const errorBox = root.querySelector<HTMLElement>('#generate-error');
  const generateBtn = root.querySelector<HTMLButtonElement>('#generate-all');
  const regenerateBtn = root.querySelector<HTMLButtonElement>('#regenerate');

  root.querySelector('#back-home')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'home' });
  });

  root.querySelector('#back-to-form')?.addEventListener('click', () => {
    ctx.router.navigate({
      type: 'create-workflow',
      draft: {
        theme: workflow.theme,
        topicsRaw: workflow.topics.join(', '),
        instructions: workflow.instructions,
        quantity: workflow.quantity,
        includeImages: workflow.includeImages,
        aiModel: workflow.aiModel,
      },
    });
  });

  regenerateBtn?.addEventListener('click', async () => {
    if (!regenerateBtn || !errorBox) return;
    errorBox.classList.add('hidden');
    regenerateBtn.disabled = true;
    regenerateBtn.textContent = i18n.t('preview.regenerating');
    try {
      const cards = await ctx.deps.generatePreview.execute(workflow);
      ctx.router.navigate({ type: 'preview', workflow, previewCards: cards });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('preview.regenerationFailed');
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
      regenerateBtn.disabled = false;
      regenerateBtn.textContent = i18n.t('preview.regenerate');
    }
  });

  generateBtn?.addEventListener('click', async () => {
    if (!generateBtn || !errorBox) return;
    errorBox.classList.add('hidden');
    generateBtn.disabled = true;
    generateBtn.textContent = i18n.t('preview.generating', { count: workflow.quantity });
    try {
      const { study, duplicatesRemoved } = await ctx.deps.generateFullStudy.execute(workflow);
      if (duplicatesRemoved > 0) {
        console.info(`Removed ${duplicatesRemoved} duplicate cards from the batch.`);
      }
      ctx.router.navigate({ type: 'study-detail', studyId: study.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('preview.generationFailed');
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
      generateBtn.disabled = false;
      generateBtn.textContent = i18n.t('preview.generateAll', { count: workflow.quantity });
    }
  });
}

function previewCardItem(card: Card, i18n: I18n): string {
  return `
    <li class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">${i18n.t('preview.cardFront')}</div>
      <div class="mb-3 text-slate-900">${escapeHtml(card.front)}</div>
      <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">${i18n.t('preview.cardBack')}</div>
      <div class="text-slate-700">${escapeHtml(card.back)}</div>
    </li>
  `;
}
