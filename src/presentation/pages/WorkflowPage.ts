import type { GenerateCardPreviewUseCase } from '@application/use-cases/GenerateCardPreviewUseCase';
import {
  type AIModelId,
  createWorkflow,
  type StudyWorkflow,
} from '@domain/study/value-objects/StudyWorkflow';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import { ValidationError } from '@shared/errors/AppError';
import type { I18n } from '@shared/i18n';
import type { PageContext, WorkflowDraft } from '../AppRouter';
import { aiErrorMessage } from '../aiErrorMessage';
import { appShell, escapeHtml } from '../components/Layout';
import { MODEL_OPTIONS } from '../components/modelOptions';
import { wireToggleGroup } from '../components/toggleGroup';

export interface WorkflowPageDeps {
  apiKeys: IApiKeyStorage;
  generatePreview: GenerateCardPreviewUseCase;
  i18n: I18n;
}

type Ctx = PageContext<WorkflowPageDeps>;

const QUANTITY_OPTIONS = [10, 25, 50, 100, 200, 500];

export function renderWorkflowPage(
  root: HTMLElement,
  ctx: Ctx,
  initialDraft?: WorkflowDraft,
): void {
  const { i18n } = ctx.deps;
  const draft: WorkflowDraft = initialDraft ?? {
    theme: '',
    topicsRaw: '',
    instructions: '',
    quantity: 50,
    includeImages: false,
    aiModel: 'gemini',
  };

  root.innerHTML = appShell(
    `
    <h1 class="text-2xl font-bold mb-1">${i18n.t('workflow.title')}</h1>
    <p class="text-slate-500 mb-6">${i18n.t('workflow.subtitle')}</p>

    <form id="workflow-form" class="space-y-5">
      ${fieldGroup({
        label: i18n.t('workflow.fields.theme'),
        hint: i18n.t('workflow.fields.themeHint'),
        input: `<input id="theme" name="theme" required minlength="2" value="${escapeHtml(draft.theme)}"
                       class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none" />`,
      })}

      ${fieldGroup({
        label: i18n.t('workflow.fields.topics'),
        hint: i18n.t('workflow.fields.topicsHint'),
        input: `<input id="topics" name="topics" value="${escapeHtml(draft.topicsRaw)}"
                       class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none" />`,
      })}

      ${fieldGroup({
        label: i18n.t('workflow.fields.instructions'),
        hint: i18n.t('workflow.fields.instructionsHint'),
        input: `<textarea id="instructions" name="instructions" rows="4"
                          class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none">${escapeHtml(draft.instructions)}</textarea>`,
      })}

      ${fieldGroup({
        label: i18n.t('workflow.fields.aiModel'),
        hint: i18n.t('workflow.fields.aiModelHint'),
        input: `<div class="grid sm:grid-cols-3 gap-2" role="radiogroup">
          ${MODEL_OPTIONS.map(
            (m) => `<button type="button" data-model="${m.id}"
                       class="text-left px-3 py-2 rounded-lg border text-sm transition ${
                         m.id === draft.aiModel
                           ? 'border-primary bg-primary/5'
                           : 'border-slate-300 bg-white hover:border-primary'
}">
                       <div class="font-medium">${i18n.t(`model.${m.id}.label`)}</div>
                       <div class="text-xs text-slate-500 mt-0.5">${i18n.t(`model.${m.id}.hint`)}</div>
                     </button>`,
          ).join('')}
        </div>
        <input type="hidden" id="ai-model" name="aiModel" value="${draft.aiModel}" />`,
      })}

      ${fieldGroup({
        label: i18n.t('workflow.fields.quantity'),
        hint: i18n.t('workflow.fields.quantityHint'),
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
        <button type="button" id="cancel-btn" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">${i18n.t('workflow.cancel')}</button>
        <button type="submit" id="submit-btn" class="px-5 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-50">
          ${i18n.t('workflow.submit')}
        </button>
      </div>
    </form>
  `,
    { back: { label: i18n.t('workflow.back'), onBackId: 'back-btn' } },
  );

  root.querySelector('#back-btn')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'home' });
  });
  root.querySelector('#cancel-btn')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'home' });
  });

  wireToggleGroup(root, '[data-quantity]', '#quantity', 'quantity', (selected) => {
    return `px-4 py-1.5 rounded-lg border text-sm transition ${selected ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white hover:border-primary'}`;
  });

  wireToggleGroup(root, '[data-model]', '#ai-model', 'model', (selected) => {
    return `text-left px-3 py-2 rounded-lg border text-sm transition ${selected ? 'border-primary bg-primary/5' : 'border-slate-300 bg-white hover:border-primary'}`;
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
        aiModel: data.aiModel,
      });
    } catch (err) {
      const message =
        err instanceof ValidationError ? err.message : i18n.t('workflow.invalidInput');
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
      return;
    }

    if (!ctx.deps.apiKeys.get(workflow.aiModel)) {
      errorBox.textContent = i18n.t('workflow.missingApiKey', { model: workflow.aiModel });
      errorBox.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = i18n.t('workflow.submitBusy');
    try {
      const previewCards = await ctx.deps.generatePreview.execute(workflow);
      ctx.router.navigate({ type: 'preview', workflow, previewCards });
    } catch (err) {
      errorBox.textContent = aiErrorMessage(err, i18n, 'workflow.previewFailed');
      errorBox.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = i18n.t('workflow.submit');
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
  const aiModel =
    (root.querySelector<HTMLInputElement>('#ai-model')?.value as AIModelId) ?? 'gemini';
  return { theme, topicsRaw, instructions, quantity, includeImages: false, aiModel };
}
