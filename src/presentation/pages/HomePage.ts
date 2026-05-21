import type { Study } from '@domain/study/entities/Study';
import type { PageContext } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';

export async function renderHomePage(root: HTMLElement, ctx: PageContext): Promise<void> {
  const studies = await ctx.container.studies.findAll();
  const hasKey = !!ctx.container.apiKeys.get('gemini');

  const apiNotice = hasKey
    ? ''
    : `<div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
         You haven't configured a Gemini API key yet. Generation will fail until you add one.
         <button id="goto-settings" class="ml-2 underline font-medium">Open settings</button>
       </div>`;

  const studiesHtml =
    studies.length === 0
      ? `<div class="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">
         <p class="mb-4">No studies yet.</p>
         <button id="create-first" class="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition">
           Create your first study
         </button>
       </div>`
      : `<ul class="space-y-3">${studies.map(studyCard).join('')}</ul>`;

  root.innerHTML = appShell(`
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">My studies</h1>
      <div class="flex gap-2">
        <button id="settings-btn" class="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">Settings</button>
        <button id="create-btn" class="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">+ New study</button>
      </div>
    </div>
    ${apiNotice}
    ${studiesHtml}
  `);

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

  for (const study of studies) {
    root.querySelector(`[data-open-study="${study.id}"]`)?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'study', study });
    });
  }
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
