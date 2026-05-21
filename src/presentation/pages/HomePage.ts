import type { ImportStudyUseCase } from '@application/use-cases/ImportStudyUseCase';
import type { Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import type { I18n } from '@shared/i18n';
import type { PageContext } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';

export interface HomePageDeps {
  studies: IStudyRepository;
  apiKeys: IApiKeyStorage;
  importStudy: ImportStudyUseCase;
  i18n: I18n;
}

type Ctx = PageContext<HomePageDeps>;

type SortMode = 'recent' | 'progress' | 'name';

const SORT_STORAGE_KEY = 'kartaak.home.sort';

export async function renderHomePage(root: HTMLElement, ctx: Ctx): Promise<void> {
  const { i18n } = ctx.deps;
  const studies = await ctx.deps.studies.findAll();
  const hasAnyKey =
    !!ctx.deps.apiKeys.get('gemini') ||
    !!ctx.deps.apiKeys.get('anthropic') ||
    !!ctx.deps.apiKeys.get('openai');

  const apiNotice = hasAnyKey
    ? ''
    : `<div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
         ${i18n.t('home.apiNotice')}
         <button id="goto-settings" class="ml-2 underline font-medium">${i18n.t('home.openSettings')}</button>
       </div>`;

  let query = '';
  let sort: SortMode = readSortMode();

  paint();

  function paint(): void {
    const filtered = applyFilters(studies, query, sort);

    const listHtml =
      studies.length === 0
        ? `<div class="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">
             <p class="mb-4">${i18n.t('home.noStudies')}</p>
             <button id="create-first" class="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition">
               ${i18n.t('home.createFirst')}
             </button>
           </div>`
        : filtered.length === 0
          ? `<p class="text-sm text-slate-500 py-6 text-center">${i18n.t('home.noMatches', { query })}</p>`
          : `<ul class="space-y-3">${filtered.map((s) => studyCard(s, i18n)).join('')}</ul>`;

    root.innerHTML = appShell(`
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">${i18n.t('home.title')}</h1>
        <div class="flex gap-2">
          <button id="settings-btn" class="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">${i18n.t('home.settings')}</button>
          <button id="import-btn" class="px-3 py-1.5 rounded-lg border border-slate-300 text-sm hover:bg-slate-100 transition">${i18n.t('home.import')}</button>
          <button id="create-btn" class="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">${i18n.t('home.newStudy')}</button>
        </div>
      </div>
      ${apiNotice}
      ${studies.length > 0 ? toolbar(query, sort, i18n) : ''}
      ${listHtml}
      <input id="import-file" type="file" accept="application/json,.json" class="hidden" />
    `);

    wireToolbar();
    wireCommonButtons();
    wireImport();
    wireOpenButtons(filtered);
  }

  function wireToolbar(): void {
    const searchInput = root.querySelector<HTMLInputElement>('#search');
    searchInput?.addEventListener('input', () => {
      query = searchInput.value;
      const list = root.querySelector('[data-studies-list]');
      const filtered = applyFilters(studies, query, sort);
      if (list) list.innerHTML = renderListInner(filtered, query, i18n);
      wireOpenButtons(filtered);
    });

    const sortSelect = root.querySelector<HTMLSelectElement>('#sort');
    sortSelect?.addEventListener('change', () => {
      sort = sortSelect.value as SortMode;
      localStorage.setItem(SORT_STORAGE_KEY, sort);
      paint();
    });
  }

  function wireCommonButtons(): void {
    root.querySelector('#create-btn')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'create-workflow' });
    });
    root.querySelector('#create-first')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'create-workflow' });
    });
    root.querySelector('#settings-btn')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'settings' });
    });
    root.querySelector('#goto-settings')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'settings' });
    });
  }

  function wireImport(): void {
    const importBtn = root.querySelector<HTMLButtonElement>('#import-btn');
    const importInput = root.querySelector<HTMLInputElement>('#import-file');
    importBtn?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const study = await ctx.deps.importStudy.execute(parsed, 'fresh-copy');
        ctx.router.navigate({ type: 'study-detail', studyId: study.id });
      } catch (err) {
        alert(err instanceof Error ? err.message : i18n.t('home.importFailed'));
      } finally {
        importInput.value = '';
      }
    });
  }

  function wireOpenButtons(filtered: Study[]): void {
    for (const study of filtered) {
      root.querySelector(`[data-open-study="${study.id}"]`)?.addEventListener('click', () => {
        ctx.router.navigate({ type: 'study-detail', studyId: study.id });
      });
      root.querySelector(`[data-quick-study="${study.id}"]`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        ctx.router.navigate({ type: 'study', study });
      });
    }
  }
}

function toolbar(query: string, sort: SortMode, i18n: I18n): string {
  return `
    <div class="flex gap-2 mb-4">
      <input id="search" type="search" value="${escapeHtml(query)}" placeholder="${i18n.t('home.searchPlaceholder')}"
             class="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm" />
      <select id="sort" class="px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm bg-white">
        <option value="recent" ${sort === 'recent' ? 'selected' : ''}>${i18n.t('home.sort.recent')}</option>
        <option value="progress" ${sort === 'progress' ? 'selected' : ''}>${i18n.t('home.sort.progress')}</option>
        <option value="name" ${sort === 'name' ? 'selected' : ''}>${i18n.t('home.sort.name')}</option>
      </select>
    </div>
    <div data-studies-list></div>
  `;
}

function renderListInner(filtered: Study[], query: string, i18n: I18n): string {
  if (filtered.length === 0) {
    return `<p class="text-sm text-slate-500 py-6 text-center">${i18n.t('home.noMatches', { query })}</p>`;
  }
  return `<ul class="space-y-3">${filtered.map((s) => studyCard(s, i18n)).join('')}</ul>`;
}

function applyFilters(studies: Study[], query: string, sort: SortMode): Study[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? studies.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.workflow.theme.toLowerCase().includes(q) ||
          s.workflow.topics.some((t) => t.toLowerCase().includes(q)),
      )
    : studies.slice();

  switch (sort) {
    case 'recent':
      filtered.sort((a, b) => (a.lastUpdatedAt > b.lastUpdatedAt ? -1 : 1));
      break;
    case 'progress':
      filtered.sort((a, b) => learnedRatio(b) - learnedRatio(a));
      break;
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  return filtered;
}

function learnedRatio(study: Study): number {
  if (study.cards.length === 0) return 0;
  return study.cards.filter((c) => c.status === 'learned').length / study.cards.length;
}

function readSortMode(): SortMode {
  const stored = localStorage.getItem(SORT_STORAGE_KEY);
  if (stored === 'recent' || stored === 'progress' || stored === 'name') return stored;
  return 'recent';
}

function studyCard(study: Study, i18n: I18n): string {
  const learned = study.cards.filter((c) => c.status === 'learned').length;
  const total = study.cards.length;
  const pct = total === 0 ? 0 : Math.round((learned / total) * 100);
  const canStudy = total > 0;
  return `
    <li class="flex items-stretch gap-2 rounded-xl border border-slate-200 bg-white hover:border-primary transition overflow-hidden">
      <button data-open-study="${study.id}" class="flex-1 text-left px-5 py-4 min-w-0">
        <div class="flex justify-between items-start gap-3 mb-2">
          <span class="font-semibold truncate">${escapeHtml(study.name)}</span>
          <span class="text-xs text-slate-400 shrink-0">${i18n.t('home.studyCardCount', { count: total })}</span>
        </div>
        <div class="h-1.5 bg-slate-100 rounded overflow-hidden">
          <div class="h-full bg-success transition-all" style="width:${pct}%"></div>
        </div>
        <div class="text-xs text-slate-500 mt-1.5">${i18n.t('home.studyProgress', { learned, total, pct })}</div>
      </button>
      ${canStudy ? quickStudyButton(study, i18n) : ''}
    </li>
  `;
}

function quickStudyButton(study: { id: string; name: string }, i18n: I18n): string {
  return `
    <button data-quick-study="${study.id}" aria-label="${i18n.t('home.studyQuickPlay', { name: study.name })}"
            class="shrink-0 w-14 flex items-center justify-center text-primary border-l border-slate-200 hover:bg-primary hover:text-white transition text-lg">
      ▶
    </button>
  `;
}
