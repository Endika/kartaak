import type { AIModelId } from '@domain/study/value-objects/StudyWorkflow';
import type { PageContext } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';

interface ProviderInfo {
  id: AIModelId;
  label: string;
  inputId: string;
  saveId: string;
  clearId: string;
  placeholder: string;
  helpUrl: string;
  helpLabel: string;
  note?: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: 'gemini',
    label: 'Gemini',
    inputId: 'key-gemini',
    saveId: 'save-gemini',
    clearId: 'clear-gemini',
    placeholder: 'AIza...',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    helpLabel: 'aistudio.google.com',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    inputId: 'key-anthropic',
    saveId: 'save-anthropic',
    clearId: 'clear-anthropic',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    helpLabel: 'console.anthropic.com',
    note: 'Calls use the dangerous-direct-browser-access header. Works without a proxy but exposes your key on the wire to anthropic.com only.',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    inputId: 'key-openai',
    saveId: 'save-openai',
    clearId: 'clear-openai',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpLabel: 'platform.openai.com',
    note: 'OpenAI does not currently allow browser-direct requests in most cases — expect CORS errors unless you run a proxy.',
  },
];

export function renderSettingsPage(root: HTMLElement, ctx: PageContext): void {
  root.innerHTML = appShell(
    `
    <h1 class="text-2xl font-bold mb-6">Settings</h1>
    ${PROVIDERS.map((p) => renderProviderSection(ctx, p)).join('')}
  `,
    { back: { label: 'Back', onBackId: 'back-btn' } },
  );

  root.querySelector('#back-btn')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'home' });
  });

  for (const provider of PROVIDERS) {
    wireProvider(root, ctx, provider);
  }
}

function renderProviderSection(ctx: PageContext, p: ProviderInfo): string {
  const currentKey = ctx.container.apiKeys.get(p.id) ?? '';
  const masked = currentKey ? `${currentKey.slice(0, 6)}••••••${currentKey.slice(-4)}` : '';

  return `
    <section class="rounded-xl border border-slate-200 bg-white p-5 mb-5">
      <h2 class="font-semibold mb-1">${escapeHtml(p.label)} API key</h2>
      <p class="text-sm text-slate-500 mb-2">
        Stored in your browser only. Get one at
        <a class="text-primary underline" href="${p.helpUrl}" target="_blank" rel="noreferrer">${p.helpLabel}</a>.
      </p>
      ${p.note ? `<p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">${p.note}</p>` : ''}
      ${currentKey ? `<p class="text-xs text-slate-500 mb-2">Currently set: <span class="font-mono">${escapeHtml(masked)}</span></p>` : ''}
      <div class="flex gap-2">
        <input id="${p.inputId}" type="password" autocomplete="off" placeholder="${escapeHtml(p.placeholder)}"
               class="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm" />
        <button id="${p.saveId}" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">Save</button>
        ${currentKey ? `<button id="${p.clearId}" class="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition">Clear</button>` : ''}
      </div>
    </section>
  `;
}

function wireProvider(root: HTMLElement, ctx: PageContext, p: ProviderInfo): void {
  const input = root.querySelector<HTMLInputElement>(`#${p.inputId}`);
  root.querySelector(`#${p.saveId}`)?.addEventListener('click', () => {
    const value = input?.value.trim() ?? '';
    if (!value) return;
    ctx.container.apiKeys.set(p.id, value);
    ctx.router.navigate({ type: 'settings' });
  });
  root.querySelector(`#${p.clearId}`)?.addEventListener('click', () => {
    ctx.container.apiKeys.clear(p.id);
    ctx.router.navigate({ type: 'settings' });
  });
}
