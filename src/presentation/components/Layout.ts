export function appShell(
  content: string,
  opts?: { back?: { label: string; onBackId: string } },
): string {
  const backBtn = opts?.back
    ? `<button id="${opts.back.onBackId}" class="text-sm text-slate-500 hover:text-slate-800 transition">← ${escapeHtml(opts.back.label)}</button>`
    : '<span></span>';

  return `
    <div class="min-h-screen flex flex-col">
      <header class="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        ${backBtn}
        <div class="text-sm font-semibold tracking-wide text-primary">Kartaak</div>
        <span></span>
      </header>
      <main class="flex-1 px-6 py-6 max-w-3xl w-full mx-auto">
        ${content}
      </main>
      <footer class="px-6 py-3 text-center text-xs text-slate-400 select-none">
        v${__APP_VERSION__}
      </footer>
    </div>
  `;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
