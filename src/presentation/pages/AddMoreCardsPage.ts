import type { Card } from '@domain/study/entities/Card';
import {
  type AIModelId,
  createWorkflow,
  type StudyWorkflow,
} from '@domain/study/value-objects/StudyWorkflow';
import { ValidationError } from '@shared/errors/AppError';
import type { PageContext } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';

const QUANTITY_OPTIONS = [10, 25, 50, 100, 200];

const MODEL_OPTIONS: { id: AIModelId; label: string; hint: string }[] = [
  { id: 'gemini', label: 'Gemini', hint: 'gemini-2.5-flash · cheap, browser-direct' },
  { id: 'anthropic', label: 'Claude', hint: 'claude-haiku-4-5 · browser-direct via header' },
  { id: 'openai', label: 'OpenAI', hint: 'gpt-4o-mini · CORS-blocked, needs proxy' },
];

interface Draft {
  topicsRaw: string;
  instructions: string;
  quantity: number;
  aiModel: AIModelId;
}

export async function renderAddMoreCardsPage(
  root: HTMLElement,
  ctx: PageContext,
  studyId: string,
): Promise<void> {
  const study = await ctx.container.studies.findById(studyId);
  if (!study) {
    root.innerHTML = appShell(`<p class="text-sm text-slate-500">Study not found.</p>`, {
      back: { label: 'Home', onBackId: 'back-home' },
    });
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

  paint();

  function paint(): void {
    if (previewCards === null) {
      paintForm();
    } else {
      paintPreview(previewCards);
    }
  }

  function paintForm(): void {
    if (!study) return;
    root.innerHTML = appShell(
      `
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
      `,
      { back: { label: 'Study', onBackId: 'back-detail' } },
    );

    root.querySelector('#back-detail')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'study-detail', studyId });
    });
    root.querySelector('#cancel-btn')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'study-detail', studyId });
    });

    wireToggle(root, '[data-quantity]', '#quantity', 'quantity', (selected) => {
      return `px-4 py-1.5 rounded-lg border text-sm transition ${selected ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white hover:border-primary'}`;
    });
    wireToggle(root, '[data-model]', '#ai-model', 'model', (selected) => {
      return `text-left px-3 py-2 rounded-lg border text-sm transition ${selected ? 'border-primary bg-primary/5' : 'border-slate-300 bg-white hover:border-primary'}`;
    });

    const form = root.querySelector<HTMLFormElement>('#add-form');
    const submitBtn = root.querySelector<HTMLButtonElement>('#submit-btn');
    const errorBox = root.querySelector<HTMLElement>('#form-error');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!study || !submitBtn || !errorBox) return;
      errorBox.classList.add('hidden');
      draft = readDraft(root, draft);

      let workflow: StudyWorkflow;
      try {
        workflow = createWorkflow({
          theme: study.workflow.theme,
          topics: draft.topicsRaw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          instructions: draft.instructions,
          quantity: draft.quantity,
          includeImages: study.workflow.includeImages,
          aiModel: draft.aiModel,
        });
      } catch (err) {
        errorBox.textContent = err instanceof ValidationError ? err.message : 'Invalid form values';
        errorBox.classList.remove('hidden');
        return;
      }

      if (!ctx.container.apiKeys.get(workflow.aiModel)) {
        errorBox.textContent = `Set a ${workflow.aiModel} API key in Settings first.`;
        errorBox.classList.remove('hidden');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating preview…';
      try {
        const cards = await ctx.container.generatePreview.execute(workflow);
        previewCards = cards;
        paint();
      } catch (err) {
        errorBox.textContent = err instanceof Error ? err.message : 'Preview failed';
        errorBox.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate preview →';
      }
    });
  }

  function paintPreview(cards: Card[]): void {
    if (!study) return;
    root.innerHTML = appShell(
      `
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
      `,
      { back: { label: 'Study', onBackId: 'back-detail' } },
    );

    root.querySelector('#back-detail')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'study-detail', studyId });
    });

    root.querySelector('#back-to-edit')?.addEventListener('click', () => {
      previewCards = null;
      paint();
    });

    const errorBox = root.querySelector<HTMLElement>('#generate-error');
    const regenerateBtn = root.querySelector<HTMLButtonElement>('#regenerate');
    const generateBtn = root.querySelector<HTMLButtonElement>('#generate-all');

    regenerateBtn?.addEventListener('click', async () => {
      if (!regenerateBtn || !errorBox) return;
      errorBox.classList.add('hidden');
      regenerateBtn.disabled = true;
      regenerateBtn.textContent = 'Regenerating…';
      try {
        const workflow = workflowFromDraft(
          study.workflow.theme,
          draft,
          study.workflow.includeImages,
        );
        const next = await ctx.container.generatePreview.execute(workflow);
        previewCards = next;
        paint();
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
        const workflow = workflowFromDraft(
          study.workflow.theme,
          draft,
          study.workflow.includeImages,
        );
        const {
          study: next,
          added,
          duplicatesRemoved,
        } = await ctx.container.addMoreCards.execute(studyId, workflow);
        if (duplicatesRemoved > 0) {
          console.info(
            `Added ${added} cards. ${duplicatesRemoved} duplicate(s) skipped vs existing.`,
          );
        }
        ctx.router.navigate({ type: 'study-detail', studyId: next.id });
      } catch (err) {
        errorBox.textContent = err instanceof Error ? err.message : 'Generation failed';
        errorBox.classList.remove('hidden');
        generateBtn.disabled = false;
        generateBtn.textContent = `Add ${draft.quantity} cards →`;
      }
    });
  }
}

function workflowFromDraft(theme: string, draft: Draft, includeImages: boolean): StudyWorkflow {
  return createWorkflow({
    theme,
    topics: draft.topicsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    instructions: draft.instructions,
    quantity: draft.quantity,
    includeImages,
    aiModel: draft.aiModel,
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

function readDraft(root: HTMLElement, current: Draft): Draft {
  return {
    topicsRaw: root.querySelector<HTMLInputElement>('#topics')?.value ?? current.topicsRaw,
    instructions:
      root.querySelector<HTMLTextAreaElement>('#instructions')?.value ?? current.instructions,
    quantity:
      Number(root.querySelector<HTMLInputElement>('#quantity')?.value ?? current.quantity) ||
      current.quantity,
    aiModel:
      (root.querySelector<HTMLInputElement>('#ai-model')?.value as AIModelId) ?? current.aiModel,
  };
}

function wireToggle(
  root: HTMLElement,
  buttonSelector: string,
  hiddenSelector: string,
  dataAttr: string,
  classFor: (selected: boolean) => string,
): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>(buttonSelector);
  const hidden = root.querySelector<HTMLInputElement>(hiddenSelector);
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset[dataAttr] ?? '';
      if (hidden) hidden.value = value;
      buttons.forEach((b) => {
        b.className = classFor(b.dataset[dataAttr] === value);
      });
    });
  });
}
