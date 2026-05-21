import type { PageContext } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';

export function renderSettingsPage(root: HTMLElement, ctx: PageContext): void {
  const currentKey = ctx.container.apiKeys.get('gemini') ?? '';
  const masked = currentKey ? `${currentKey.slice(0, 6)}••••••${currentKey.slice(-4)}` : '';

  root.innerHTML = appShell(`
    <h1 class="text-2xl font-bold mb-6">Settings</h1>

    <section class="rounded-xl border border-slate-200 bg-white p-5 mb-5">
      <h2 class="font-semibold mb-1">Gemini API key</h2>
      <p class="text-sm text-slate-500 mb-3">
        Stored in your browser only. Get one at
        <a class="text-primary underline" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">aistudio.google.com</a>.
      </p>
      ${currentKey ? `<p class="text-xs text-slate-500 mb-2">Currently set: <span class="font-mono">${escapeHtml(masked)}</span></p>` : ''}
      <div class="flex gap-2">
        <input id="api-key-input" type="password" autocomplete="off" placeholder="AIza..."
               class="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm" />
        <button id="save-key" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">Save</button>
        ${currentKey ? '<button id="clear-key" class="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition">Clear</button>' : ''}
      </div>
      <p id="save-status" class="text-xs mt-2 text-slate-500"></p>
    </section>
  `, { back: { label: 'Back', onBackId: 'back-btn' } });

  root.querySelector('#back-btn')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'home' });
  });

  const input = root.querySelector<HTMLInputElement>('#api-key-input');
  const status = root.querySelector<HTMLElement>('#save-status');

  root.querySelector('#save-key')?.addEventListener('click', () => {
    const value = input?.value ?? '';
    if (!value.trim()) {
      if (status) status.textContent = 'Enter a key first.';
      return;
    }
    ctx.container.apiKeys.set('gemini', value);
    if (status) {
      status.textContent = 'Saved.';
      status.classList.add('text-success');
    }
    setTimeout(() => ctx.router.navigate({ type: 'settings' }), 600);
  });

  root.querySelector('#clear-key')?.addEventListener('click', () => {
    ctx.container.apiKeys.clear('gemini');
    ctx.router.navigate({ type: 'settings' });
  });
}
