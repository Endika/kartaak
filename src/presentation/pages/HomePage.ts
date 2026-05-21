import type { Study } from '@domain/study/entities/Study';
import type { PageContext } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';

type SortMode = 'recent' | 'progress' | 'name';

const SORT_STORAGE_KEY = 'kartaak.home.sort';

export async function renderHomePage(root: HTMLElement, ctx: PageContext): Promise<void> {
  const studies = await ctx.container.studies.findAll();
  const hasAnyKey =
    !!ctx.container.apiKeys.get('gemini') ||
    !!ctx.container.apiKeys.get('anthropic') ||
    !!ctx.container.apiKeys.get('openai');

  const apiNotice = hasAnyKey
    ? ''
    : `<div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
         No AI provider configured yet. Generation will fail until you add a key.
         <button id="goto-settings" class="ml-2 underline font-medium">Open settings</button>
       </div>`;

  let query = '';
  let sort: SortMode = readSortMode();

  paint();

  function paint(): void {
    const filtered = applyFilters(studies, query, sort);

    const listHtml =
      studies.length === 0
        ? `<div class="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">
             <p class="mb-4">No studies yet.</p>
             <button id="create-first" class="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition">
               Create your first study
             </button>
           </div>`
        : filtered.length === 0
          ? `<p class="text-sm text-slate-500 py-6 text-center">No studies match "${escapeHtml(query)}".</p>`
          : `<ul class="space-y-3">${filtered.map(studyCard).join('')}</ul>`;

    root.innerHTML = appShell(`
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">My studies</h1>
        <div class="flex gap-2">
          <button id="settings-btn" class="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Settings</button>
          <button id="import-btn" class="px-3 py-1.5 rounded-lg border border-slate-300 text-sm hover:bg-slate-100 transition">Import</button>
          <button id="create-btn" class="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">+ New study</button>
        </div>
      </div>
      ${apiNotice}
      ${studies.length > 0 ? toolbar(query, sort) : ''}
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
      if (list) list.innerHTML = renderListInner(filtered, query);
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
        const study = await ctx.container.importStudy.execute(parsed, 'fresh-copy');
        ctx.router.navigate({ type: 'study-detail', studyId: study.id });
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Import failed');
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
    }
  }
}

function toolbar(query: string, sort: SortMode): string {
  return `
    <div class="flex gap-2 mb-4">
      <input id="search" type="search" value="${escapeHtml(query)}" placeholder="Search studies…"
             class="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm" />
      <select id="sort" class="px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm bg-white">
        <option value="recent" ${sort === 'recent' ? 'selected' : ''}>Recent</option>
        <option value="progress" ${sort === 'progress' ? 'selected' : ''}>Progress</option>
        <option value="name" ${sort === 'name' ? 'selected' : ''}>Name</option>
      </select>
    </div>
    <div data-studies-list></div>
  `;
}

function renderListInner(filtered: Study[], query: string): string {
  if (filtered.length === 0) {
    return `<p class="text-sm text-slate-500 py-6 text-center">No studies match "${escapeHtml(query)}".</p>`;
  }
  return `<ul class="space-y-3">${filtered.map(studyCard).join('')}</ul>`;
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

function studyCard(study: Study): string {
  const learned = study.cards.filter((c) => c.status === 'learned').length;
  const total = study.cards.length;
  const pct = total === 0 ? 0 : Math.round((learned / total) * 100);
  return `
    <li>
      <button data-open-study="${study.id}" class="w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-primary transition">
        <div class="flex justify-between items-start mb-2">
          <span class="font-semibold">${escapeHtml(study.name)}</span>
          <span class="text-xs text-slate-400">${total} cards</span>
        </div>
        <div class="h-1.5 bg-slate-100 rounded overflow-hidden">
          <div class="h-full bg-success transition-all" style="width:${pct}%"></div>
        </div>
        <div class="text-xs text-slate-500 mt-1.5">${learned}/${total} learned · ${pct}%</div>
      </button>
    </li>
  `;
}
