import type { GenerateCardPreviewUseCase } from '@application/use-cases/GenerateCardPreviewUseCase';
import type { Card } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import { ValidationError } from '@shared/errors/AppError';
import { appShell, escapeHtml } from '../../components/Layout';
import { MODEL_OPTIONS } from '../../components/modelOptions';
import { wireToggleGroup } from '../../components/toggleGroup';
import { type Draft, readDraft, workflowFromDraft } from './draft';

const QUANTITY_OPTIONS = [10, 25, 50, 100, 200];

export interface FormViewDeps {
  apiKeys: IApiKeyStorage;
  generatePreview: GenerateCardPreviewUseCase;
}

export interface FormViewCallbacks {
  onBack: () => void;
  onPreviewReady: (cards: Card[], draft: Draft) => void;
}

export function paintForm(
  root: HTMLElement,
  study: Study,
  draft: Draft,
  deps: FormViewDeps,
  callbacks: FormViewCallbacks,
): void {
  root.innerHTML = appShell(formHtml(study, draft), {
    back: { label: 'Study', onBackId: 'back-detail' },
  });

  root.querySelector('#back-detail')?.addEventListener('click', callbacks.onBack);
  root.querySelector('#cancel-btn')?.addEventListener('click', callbacks.onBack);

  wireToggleGroup(
    root,
    '[data-quantity]',
    '#quantity',
    'quantity',
    (selected) =>
      `px-4 py-1.5 rounded-lg border text-sm transition ${selected ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white hover:border-primary'}`,
  );
  wireToggleGroup(
    root,
    '[data-model]',
    '#ai-model',
    'model',
    (selected) =>
      `text-left px-3 py-2 rounded-lg border text-sm transition ${selected ? 'border-primary bg-primary/5' : 'border-slate-300 bg-white hover:border-primary'}`,
  );

  const form = root.querySelector<HTMLFormElement>('#add-form');
  const submitBtn = root.querySelector<HTMLButtonElement>('#submit-btn');
  const errorBox = root.querySelector<HTMLElement>('#form-error');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!submitBtn || !errorBox) return;
    errorBox.classList.add('hidden');
    const nextDraft = readDraft(root, draft);

    let workflow: StudyWorkflow;
    try {
      workflow = workflowFromDraft(study.workflow.theme, nextDraft, study.workflow.includeImages);
    } catch (err) {
      errorBox.textContent = err instanceof ValidationError ? err.message : 'Invalid form values';
      errorBox.classList.remove('hidden');
      return;
    }

    if (!deps.apiKeys.get(workflow.aiModel)) {
      errorBox.textContent = `Set a ${workflow.aiModel} API key in Settings first.`;
      errorBox.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating preview…';
    try {
      const cards = await deps.generatePreview.execute(workflow);
      callbacks.onPreviewReady(cards, nextDraft);
    } catch (err) {
      errorBox.textContent = err instanceof Error ? err.message : 'Preview failed';
      errorBox.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Generate preview →';
    }
  });
}

function formHtml(study: Study, draft: Draft): string {
  return `
    <h1 class="text-2xl font-bold mb-1">Add more cards</h1>
    <p class="text-sm text-slate-500 mb-1">Adding to <strong>${escapeHtml(study.name)}</strong></p>
    <p class="text-xs text-slate-400 mb-6">${study.cards.length} cards already in this study. Edit the workflow if you want to nudge the new batch (e.g. raise the level, switch to Claude).</p>

    <form id="add-form" class="space-y-5">
      <div>
        <label class="block font-medium mb-1">Theme</label>
        <p class="text-xs text-slate-500 mb-2">Locked to keep new cards on-topic with the existing batch.</p>
        <input value="${escapeHtml(study.workflow.theme)}" disabled
               class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500" />
      </div>

      <div>
        <label class="block font-medium mb-1">Subtopics</label>
        <input id="topics" value="${escapeHtml(draft.topicsRaw)}"
               class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none" />
      </div>

      <div>
        <label class="block font-medium mb-1">Generation instructions</label>
        <textarea id="instructions" rows="4"
          class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none">${escapeHtml(draft.instructions)}</textarea>
      </div>

      <div>
        <label class="block font-medium mb-1">AI model</label>
        <div class="grid sm:grid-cols-3 gap-2">
          ${MODEL_OPTIONS.map(
            (m) => `<button type="button" data-model="${m.id}"
                     class="text-left px-3 py-2 rounded-lg border text-sm transition ${
                       m.id === draft.aiModel
                         ? 'border-primary bg-primary/5'
                         : 'border-slate-300 bg-white hover:border-primary'
}">
                     <div class="font-medium">${escapeHtml(m.label)}</div>
                     <div class="text-xs text-slate-500 mt-0.5">${escapeHtml(m.hint)}</div>
                   </button>`,
          ).join('')}
        </div>
        <input type="hidden" id="ai-model" value="${draft.aiModel}" />
      </div>

      <div>
        <label class="block font-medium mb-1">How many to add?</label>
        <div class="flex flex-wrap gap-2">
          ${QUANTITY_OPTIONS.map(
            (q) => `<button type="button" data-quantity="${q}"
                     class="px-4 py-1.5 rounded-lg border text-sm transition ${
                       q === draft.quantity
                         ? 'border-primary bg-primary text-white'
                         : 'border-slate-300 bg-white hover:border-primary'
}">${q}</button>`,
          ).join('')}
        </div>
        <input type="hidden" id="quantity" value="${draft.quantity}" />
      </div>

      <div id="form-error" class="hidden rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"></div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" id="cancel-btn" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">Cancel</button>
        <button type="submit" id="submit-btn" class="px-5 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-50">
          Generate preview →
        </button>
      </div>
    </form>
  `;
}
