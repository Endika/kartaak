import type { AddMoreCardsUseCase } from '@application/use-cases/AddMoreCardsUseCase';
import type { GenerateCardPreviewUseCase } from '@application/use-cases/GenerateCardPreviewUseCase';
import type { Card } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import { appShell, escapeHtml } from '../../components/Layout';
import { type Draft, workflowFromDraft } from './draft';

export interface PreviewViewDeps {
  generatePreview: GenerateCardPreviewUseCase;
  addMoreCards: AddMoreCardsUseCase;
}

export interface PreviewViewCallbacks {
  onBackToDetail: () => void;
  onBackToForm: () => void;
  onRegenerated: (cards: Card[]) => void;
  onAdded: (updatedStudyId: string) => void;
}

export function paintPreview(
  root: HTMLElement,
  study: Study,
  cards: Card[],
  draft: Draft,
  deps: PreviewViewDeps,
  callbacks: PreviewViewCallbacks,
): void {
  root.innerHTML = appShell(previewHtml(study, cards, draft), {
    back: { label: 'Study', onBackId: 'back-detail' },
  });

  root.querySelector('#back-detail')?.addEventListener('click', callbacks.onBackToDetail);
  root.querySelector('#back-to-edit')?.addEventListener('click', callbacks.onBackToForm);

  const errorBox = root.querySelector<HTMLElement>('#generate-error');
  const regenerateBtn = root.querySelector<HTMLButtonElement>('#regenerate');
  const generateBtn = root.querySelector<HTMLButtonElement>('#generate-all');

  regenerateBtn?.addEventListener('click', async () => {
    if (!regenerateBtn || !errorBox) return;
    errorBox.classList.add('hidden');
    regenerateBtn.disabled = true;
    regenerateBtn.textContent = 'Regenerating…';
    try {
      const workflow = workflowFromDraft(study.workflow.theme, draft, study.workflow.includeImages);
      const next = await deps.generatePreview.execute(workflow);
      callbacks.onRegenerated(next);
    } catch (err) {
      errorBox.textContent = err instanceof Error ? err.message : 'Preview failed';
      errorBox.classList.remove('hidden');
      regenerateBtn.disabled = false;
      regenerateBtn.textContent = 'Regenerate';
    }
  });

  generateBtn?.addEventListener('click', async () => {
    if (!generateBtn || !errorBox) return;
    errorBox.classList.add('hidden');
    generateBtn.disabled = true;
    generateBtn.textContent = `Adding ${draft.quantity}…`;
    try {
      const workflow = workflowFromDraft(study.workflow.theme, draft, study.workflow.includeImages);
      const {
        study: next,
        added,
        duplicatesRemoved,
      } = await deps.addMoreCards.execute(study.id, workflow);
      if (duplicatesRemoved > 0) {
        console.info(
          `Added ${added} cards. ${duplicatesRemoved} duplicate(s) skipped vs existing.`,
        );
      }
      callbacks.onAdded(next.id);
    } catch (err) {
      errorBox.textContent = err instanceof Error ? err.message : 'Generation failed';
      errorBox.classList.remove('hidden');
      generateBtn.disabled = false;
      generateBtn.textContent = `Add ${draft.quantity} cards →`;
    }
  });
}

function previewHtml(study: Study, cards: Card[], draft: Draft): string {
  return `
    <h1 class="text-2xl font-bold mb-1">Preview new cards</h1>
    <p class="text-sm text-slate-500 mb-1">Adding to <strong>${escapeHtml(study.name)}</strong></p>
    <p class="text-xs text-slate-400 mb-6">${cards.length} sample cards from a ${draft.quantity}-card batch.</p>

    <ul class="space-y-3 mb-8">
      ${cards.map(previewCardItem).join('')}
    </ul>

    <div id="generate-error" class="hidden mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"></div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <button id="back-to-edit" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">← Adjust</button>
      <div class="flex gap-2">
        <button id="regenerate" class="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition">Regenerate</button>
        <button id="generate-all" class="px-5 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-50">
          Add ${draft.quantity} cards →
        </button>
      </div>
    </div>
  `;
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
