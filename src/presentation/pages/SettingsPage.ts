import type { AIModelId } from '@domain/study/value-objects/StudyWorkflow';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import { type I18n, isLocale, LOCALE_LABELS, LOCALES } from '@shared/i18n';
import type { PageContext } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';

export interface SettingsPageDeps {
  apiKeys: IApiKeyStorage;
  i18n: I18n;
}

type Ctx = PageContext<SettingsPageDeps>;

interface ProviderInfo {
  id: AIModelId;
  labelKey: string;
  inputId: string;
  saveId: string;
  clearId: string;
  placeholder: string;
  helpUrl: string;
  helpLabel: string;
  noteKey?: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: 'gemini',
    labelKey: 'settings.provider.gemini.label',
    inputId: 'key-gemini',
    saveId: 'save-gemini',
    clearId: 'clear-gemini',
    placeholder: 'AIza...',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    helpLabel: 'aistudio.google.com',
  },
  {
    id: 'anthropic',
    labelKey: 'settings.provider.anthropic.label',
    inputId: 'key-anthropic',
    saveId: 'save-anthropic',
    clearId: 'clear-anthropic',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    helpLabel: 'console.anthropic.com',
    noteKey: 'settings.provider.anthropic.note',
  },
  {
    id: 'openai',
    labelKey: 'settings.provider.openai.label',
    inputId: 'key-openai',
    saveId: 'save-openai',
    clearId: 'clear-openai',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpLabel: 'platform.openai.com',
    noteKey: 'settings.provider.openai.note',
  },
];

export function renderSettingsPage(root: HTMLElement, ctx: Ctx): void {
  const { i18n } = ctx.deps;

  root.innerHTML = appShell(
    `
    <h1 class="text-2xl font-bold mb-6">${i18n.t('settings.title')}</h1>
    ${renderLanguageSection(i18n)}
    ${PROVIDERS.map((p) => renderProviderSection(ctx, p)).join('')}
  `,
    { back: { label: i18n.t('settings.back'), onBackId: 'back-btn' } },
  );

  root.querySelector('#back-btn')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'home' });
  });

  wireLanguageSelector(root, i18n);

  for (const provider of PROVIDERS) {
    wireProvider(root, ctx, provider);
  }
}

function renderLanguageSection(i18n: I18n): string {
  const current = i18n.getLocale();
  const options = LOCALES.map(
    (locale) =>
      `<option value="${locale}" ${locale === current ? 'selected' : ''}>${escapeHtml(LOCALE_LABELS[locale])}</option>`,
  ).join('');
  return `
    <section class="rounded-xl border border-slate-200 bg-white p-5 mb-5">
      <h2 class="font-semibold mb-1">${i18n.t('settings.language.heading')}</h2>
      <p class="text-sm text-slate-500 mb-3">${i18n.t('settings.language.hint')}</p>
      <select id="locale-select" class="px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm bg-white">
        ${options}
      </select>
    </section>
  `;
}

function wireLanguageSelector(root: HTMLElement, i18n: I18n): void {
  const select = root.querySelector<HTMLSelectElement>('#locale-select');
  select?.addEventListener('change', () => {
    const value = select.value;
    if (isLocale(value)) i18n.setLocale(value);
  });
}

function renderProviderSection(ctx: Ctx, p: ProviderInfo): string {
  const { i18n } = ctx.deps;
  const currentKey = ctx.deps.apiKeys.get(p.id) ?? '';
  const masked = currentKey ? `${currentKey.slice(0, 6)}••••••${currentKey.slice(-4)}` : '';
  const providerLabel = i18n.t(p.labelKey);

  return `
    <section class="rounded-xl border border-slate-200 bg-white p-5 mb-5">
      <h2 class="font-semibold mb-1">${i18n.t('settings.provider.heading', { provider: providerLabel })}</h2>
      <p class="text-sm text-slate-500 mb-2">
        ${i18n.t('settings.provider.storedHelp')}
        <a class="text-primary underline" href="${p.helpUrl}" target="_blank" rel="noreferrer">${p.helpLabel}</a>.
      </p>
      ${p.noteKey ? `<p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">${i18n.t(p.noteKey)}</p>` : ''}
      ${currentKey ? `<p class="text-xs text-slate-500 mb-2">${i18n.t('settings.provider.currentlySet')} <span class="font-mono">${escapeHtml(masked)}</span></p>` : ''}
      <div class="flex gap-2">
        <input id="${p.inputId}" type="password" autocomplete="off" placeholder="${escapeHtml(p.placeholder)}"
               class="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm" />
        <button id="${p.saveId}" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">${i18n.t('settings.provider.save')}</button>
        ${currentKey ? `<button id="${p.clearId}" class="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition">${i18n.t('settings.provider.clear')}</button>` : ''}
      </div>
    </section>
  `;
}

function wireProvider(root: HTMLElement, ctx: Ctx, p: ProviderInfo): void {
  const input = root.querySelector<HTMLInputElement>(`#${p.inputId}`);
  root.querySelector(`#${p.saveId}`)?.addEventListener('click', () => {
    const value = input?.value.trim() ?? '';
    if (!value) return;
    ctx.deps.apiKeys.set(p.id, value);
    ctx.router.navigate({ type: 'settings' });
  });
  root.querySelector(`#${p.clearId}`)?.addEventListener('click', () => {
    ctx.deps.apiKeys.clear(p.id);
    ctx.router.navigate({ type: 'settings' });
  });
}
