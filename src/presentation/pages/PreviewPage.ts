import type { GenerateCardPreviewUseCase } from '@application/use-cases/GenerateCardPreviewUseCase';
import type { GenerateFullStudyUseCase } from '@application/use-cases/GenerateFullStudyUseCase';
import type { Card } from '@domain/study/entities/Card';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type { PageContext } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';

export interface PreviewPageDeps {
  generatePreview: GenerateCardPreviewUseCase;
  generateFullStudy: GenerateFullStudyUseCase;
}

type Ctx = PageContext<PreviewPageDeps>;

export function renderPreviewPage(
  root: HTMLElement,
  ctx: Ctx,
  workflow: StudyWorkflow,
  previewCards: Card[],
): void {
  const summary = `
    <span class="font-medium">${escapeHtml(workflow.theme)}</span>
    ${workflow.topics.length > 0 ? ` · ${workflow.topics.map(escapeHtml).join(', ')}` : ''}
    · ${workflow.quantity} cards · model: ${workflow.aiModel}
  `;

  root.innerHTML = appShell(
    `
    <h1 class="text-2xl font-bold mb-1">Preview</h1>
    <p class="text-sm text-slate-500 mb-1">${previewCards.length} sample cards from the model.</p>
    <p class="text-xs text-slate-400 mb-6">${summary}</p>

    <ul class="space-y-3 mb-8">
      ${previewCards.map(previewCardItem).join('')}
    </ul>

    <div id="generate-error" class="hidden mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"></div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <button id="back-to-form" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">← Edit workflow</button>
      <div class="flex gap-2">
        <button id="regenerate" class="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition">Regenerate preview</button>
        <button id="generate-all" class="px-5 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-50">
          Generate all ${workflow.quantity} →
        </button>
      </div>
    </div>
  `,
    { back: { label: 'Home', onBackId: 'back-home' } },
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
    regenerateBtn.textContent = 'Regenerating…';
    try {
      const cards = await ctx.deps.generatePreview.execute(workflow);
      ctx.router.navigate({ type: 'preview', workflow, previewCards: cards });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Regeneration failed';
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
      regenerateBtn.disabled = false;
      regenerateBtn.textContent = 'Regenerate preview';
    }
  });

  generateBtn?.addEventListener('click', async () => {
    if (!generateBtn || !errorBox) return;
    errorBox.classList.add('hidden');
    generateBtn.disabled = true;
    generateBtn.textContent = `Generating ${workflow.quantity}…`;
    try {
      const { study, duplicatesRemoved } = await ctx.deps.generateFullStudy.execute(workflow);
      if (duplicatesRemoved > 0) {
        console.info(`Removed ${duplicatesRemoved} duplicate cards from the batch.`);
      }
      ctx.router.navigate({ type: 'study-detail', studyId: study.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
      generateBtn.disabled = false;
      generateBtn.textContent = `Generate all ${workflow.quantity} →`;
    }
  });
}

function previewCardItem(card: Card): string {
  return `
    <li class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">Front</div>
      <div class="mb-3 text-slate-900">${escapeHtml(card.front)}</div>
      <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">Back</div>
      <div class="text-slate-700">${escapeHtml(card.back)}</div>
    </li>
  `;
}
