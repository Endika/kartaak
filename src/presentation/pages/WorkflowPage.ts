import { createWorkflow, type StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { ValidationError } from '@shared/errors/AppError';
import type { PageContext, WorkflowDraft } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';

const QUANTITY_OPTIONS = [10, 25, 50, 100, 200, 500];

export function renderWorkflowPage(
  root: HTMLElement,
  ctx: PageContext,
  initialDraft?: WorkflowDraft,
): void {
  const draft: WorkflowDraft = initialDraft ?? {
    theme: '',
    topicsRaw: '',
    instructions: '',
    quantity: 50,
    includeImages: false,
  };

  root.innerHTML = appShell(
    `
    <h1 class="text-2xl font-bold mb-1">New study</h1>
    <p class="text-slate-500 mb-6">Describe what you want to learn. The AI will draft a preview before generating the full deck.</p>

    <form id="workflow-form" class="space-y-5">
      ${fieldGroup({
        label: 'Theme',
        hint: 'What are you studying? e.g. "Multiplication tables", "Spanish for travel", "JavaScript closures".',
        input: `<input id="theme" name="theme" required minlength="2" value="${escapeHtml(draft.theme)}"
                       class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none" />`,
      })}

      ${fieldGroup({
        label: 'Subtopics (optional)',
        hint: 'Comma-separated. e.g. "7, 8" or "Travel, Restaurant, Hotel".',
        input: `<input id="topics" name="topics" value="${escapeHtml(draft.topicsRaw)}"
                       class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none" />`,
      })}

      ${fieldGroup({
        label: 'Generation instructions (optional)',
        hint: 'Tell the AI how you want cards. Format, difficulty, style. Leave blank for sensible defaults.',
        input: `<textarea id="instructions" name="instructions" rows="4"
                          class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none">${escapeHtml(draft.instructions)}</textarea>`,
      })}

      ${fieldGroup({
        label: 'How many cards?',
        hint: 'A preview of 4 cards is generated first — you only pay for the full batch once you approve.',
        input: `<div class="flex flex-wrap gap-2" role="radiogroup">
          ${QUANTITY_OPTIONS.map(
            (q) => `<button type="button" data-quantity="${q}"
                       class="px-4 py-1.5 rounded-lg border text-sm transition ${
                         q === draft.quantity
                           ? 'border-primary bg-primary text-white'
                           : 'border-slate-300 bg-white hover:border-primary'
}">${q}</button>`,
          ).join('')}
        </div>
        <input type="hidden" id="quantity" name="quantity" value="${draft.quantity}" />`,
      })}

      <div id="form-error" class="hidden rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"></div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" id="cancel-btn" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">Cancel</button>
        <button type="submit" id="submit-btn" class="px-5 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-50">
          Generate preview →
        </button>
      </div>
    </form>
  `,
    { back: { label: 'Back', onBackId: 'back-btn' } },
  );

  root.querySelector('#back-btn')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'home' });
  });
  root.querySelector('#cancel-btn')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'home' });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-quantity]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = Number(btn.dataset.quantity);
      const hidden = root.querySelector<HTMLInputElement>('#quantity');
      if (hidden) hidden.value = String(value);
      root.querySelectorAll<HTMLButtonElement>('[data-quantity]').forEach((b) => {
        const selected = Number(b.dataset.quantity) === value;
        b.className = `px-4 py-1.5 rounded-lg border text-sm transition ${
          selected
            ? 'border-primary bg-primary text-white'
            : 'border-slate-300 bg-white hover:border-primary'
        }`;
      });
    });
  });

  const form = root.querySelector<HTMLFormElement>('#workflow-form');
  const submitBtn = root.querySelector<HTMLButtonElement>('#submit-btn');
  const errorBox = root.querySelector<HTMLElement>('#form-error');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!submitBtn || !errorBox) return;
    errorBox.classList.add('hidden');

    const data = readForm(root);
    let workflow: StudyWorkflow;
    try {
      workflow = createWorkflow({
        theme: data.theme,
        topics: data.topicsRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        instructions: data.instructions,
        quantity: data.quantity,
        includeImages: data.includeImages,
        aiModel: 'gemini',
      });
    } catch (err) {
      const message = err instanceof ValidationError ? err.message : 'Invalid input';
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
      return;
    }

    if (!ctx.container.apiKeys.get('gemini')) {
      errorBox.textContent = 'Set a Gemini API key in Settings first.';
      errorBox.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating preview…';
    try {
      const previewCards = await ctx.container.generatePreview.execute(workflow);
      ctx.router.navigate({ type: 'preview', workflow, previewCards });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Preview failed';
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Generate preview →';
    }
  });
}

function fieldGroup(opts: { label: string; hint: string; input: string }): string {
  return `
    <div>
      <label class="block font-medium mb-1">${escapeHtml(opts.label)}</label>
      <p class="text-xs text-slate-500 mb-2">${escapeHtml(opts.hint)}</p>
      ${opts.input}
    </div>
  `;
}

function readForm(root: HTMLElement): WorkflowDraft {
  const theme = root.querySelector<HTMLInputElement>('#theme')?.value ?? '';
  const topicsRaw = root.querySelector<HTMLInputElement>('#topics')?.value ?? '';
  const instructions = root.querySelector<HTMLTextAreaElement>('#instructions')?.value ?? '';
  const quantity = Number(root.querySelector<HTMLInputElement>('#quantity')?.value ?? '50');
  return { theme, topicsRaw, instructions, quantity, includeImages: false };
}
