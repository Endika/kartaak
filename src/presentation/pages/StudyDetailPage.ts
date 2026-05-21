import type { Card } from '@domain/study/entities/Card';
import { pendingIssueCount } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import type { PageContext } from '../AppRouter';
import { openEditCardModal } from '../components/EditCardModal';
import { appShell, escapeHtml } from '../components/Layout';
import { openModal } from '../components/Modal';

export async function renderStudyDetailPage(
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

  paint(root, ctx, study);
}

function paint(root: HTMLElement, ctx: PageContext, study: Study): void {
  const counts = countByStatus(study.cards);
  const total = study.cards.length;
  const learnedPct = total === 0 ? 0 : Math.round((counts.learned / total) * 100);
  const issuesCount = study.cards.reduce((acc, c) => acc + pendingIssueCount(c), 0);

  root.innerHTML = appShell(
    `
    <header class="mb-6">
      <h1 class="text-2xl font-bold mb-1">${escapeHtml(study.name)}</h1>
      <p class="text-sm text-slate-500">
        ${escapeHtml(study.workflow.theme)}
        ${study.workflow.topics.length > 0 ? ` · ${escapeHtml(study.workflow.topics.join(', '))}` : ''}
        · model: ${escapeHtml(study.workflow.aiModel)}
      </p>
    </header>

    <section class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      ${statTile('Total', String(total), 'slate')}
      ${statTile('New', String(counts.new), 'sky')}
      ${statTile('Learning', String(counts.learning), 'amber')}
      ${statTile('Learned', `${counts.learned} (${learnedPct}%)`, 'emerald')}
    </section>

    <section class="flex flex-wrap gap-2 mb-6">
      <button id="action-study" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">▶ Study</button>
      <button id="action-export" class="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100 transition">📤 Export</button>
      <button id="action-delete" class="px-4 py-2 rounded-lg border border-red-200 text-sm text-danger hover:bg-red-50 transition ml-auto">🗑 Delete</button>
    </section>

    ${issuesCount > 0 ? renderIssuesSection(study) : ''}

    <section>
      <h2 class="font-semibold mb-3">Cards <span class="text-slate-400 font-normal">(${total})</span></h2>
      <ul class="space-y-2">
        ${study.cards.map((c, i) => cardRow(c, i)).join('')}
      </ul>
    </section>
  `,
    { back: { label: 'Studies', onBackId: 'back-home' } },
  );

  root.querySelector('#back-home')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'home' });
  });

  root.querySelector('#action-study')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'study', study });
  });

  root.querySelector('#action-export')?.addEventListener('click', () => {
    void exportStudy(ctx, study);
  });

  root.querySelector('#action-delete')?.addEventListener('click', () => {
    confirmDelete(ctx, study);
  });

  for (const card of study.cards) {
    root.querySelector(`[data-edit-card="${card.id}"]`)?.addEventListener('click', () => {
      openEditCardModal(ctx.container, study, card, (next) => paint(root, ctx, next));
    });
  }

  for (const card of study.cards) {
    for (const issue of card.issues ?? []) {
      root
        .querySelector(`[data-issue-resolve="${issue.id}"]`)
        ?.addEventListener('click', async () => {
          const next = await ctx.container.updateIssueStatus.execute(
            study.id,
            card.id,
            issue.id,
            'resolve',
          );
          paint(root, ctx, next);
        });
      root
        .querySelector(`[data-issue-dismiss="${issue.id}"]`)
        ?.addEventListener('click', async () => {
          const next = await ctx.container.updateIssueStatus.execute(
            study.id,
            card.id,
            issue.id,
            'dismiss',
          );
          paint(root, ctx, next);
        });
    }
  }
}

function countByStatus(cards: Card[]): { new: number; learning: number; learned: number } {
  const counts = { new: 0, learning: 0, learned: 0 };
  for (const c of cards) counts[c.status] += 1;
  return counts;
}

function statTile(label: string, value: string, tone: string): string {
  const palette: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  return `
    <div class="rounded-lg ${palette[tone] ?? palette.slate} px-3 py-2">
      <div class="text-xs uppercase tracking-wide opacity-70">${escapeHtml(label)}</div>
      <div class="text-lg font-semibold">${escapeHtml(value)}</div>
    </div>
  `;
}

function cardRow(card: Card, index: number): string {
  const statusColor = {
    new: 'bg-sky-100 text-sky-700',
    learning: 'bg-amber-100 text-amber-700',
    learned: 'bg-emerald-100 text-emerald-700',
  }[card.status];
  const issuesBadge =
    pendingIssueCount(card) > 0
      ? `<span class="text-xs rounded-full bg-red-100 text-red-700 px-2 py-0.5">⚠ ${pendingIssueCount(card)}</span>`
      : '';
  return `
    <li class="rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-start gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs text-slate-400">#${index + 1}</span>
          <span class="text-xs rounded-full px-2 py-0.5 ${statusColor}">${card.status}</span>
          ${card.isEdited ? '<span class="text-xs text-slate-400">edited</span>' : ''}
          ${issuesBadge}
        </div>
        <div class="text-sm font-medium text-slate-900 truncate">${escapeHtml(card.front)}</div>
        <div class="text-xs text-slate-500 truncate">${escapeHtml(card.back)}</div>
      </div>
      <button data-edit-card="${card.id}" class="text-slate-400 hover:text-primary text-sm shrink-0" aria-label="Edit card">✏️</button>
    </li>
  `;
}

function renderIssuesSection(study: Study): string {
  const rows: string[] = [];
  for (const card of study.cards) {
    for (const issue of card.issues ?? []) {
      if (issue.status !== 'pending') continue;
      rows.push(`
        <li class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <div class="text-xs uppercase tracking-wide text-amber-700 mb-1">${escapeHtml(issue.type)}</div>
          <div class="text-sm text-slate-900 mb-1">${escapeHtml(card.front)}</div>
          ${issue.description ? `<div class="text-xs text-slate-600 mb-2">${escapeHtml(issue.description)}</div>` : ''}
          <div class="flex gap-2">
            <button data-issue-resolve="${issue.id}" class="text-xs px-2.5 py-1 rounded bg-success text-white hover:opacity-90 transition">Mark resolved</button>
            <button data-issue-dismiss="${issue.id}" class="text-xs px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 transition">Dismiss</button>
          </div>
        </li>
      `);
    }
  }
  if (rows.length === 0) return '';
  return `
    <section class="mb-6">
      <h2 class="font-semibold mb-3">Pending issues <span class="text-slate-400 font-normal">(${rows.length})</span></h2>
      <ul class="space-y-2">${rows.join('')}</ul>
    </section>
  `;
}

function exportStudy(ctx: PageContext, study: Study): Promise<void> {
  return ctx.container.exportStudy.execute(study.id).then((envelope) => {
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = study.name.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
    a.href = url;
    a.download = `kartaak-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

function confirmDelete(ctx: PageContext, study: Study): void {
  const modal = openModal(
    {
      title: 'Delete this study?',
      primaryLabel: 'Delete',
      secondaryLabel: 'Cancel',
      destructive: true,
      bodyHtml: `
        <p class="text-sm text-slate-600">
          You are about to delete <strong>${escapeHtml(study.name)}</strong>, including
          ${study.cards.length} cards and all progress. This cannot be undone.
        </p>
      `,
    },
    async () => {
      modal.setBusy(true, 'Deleting…');
      await ctx.container.deleteStudy.execute(study.id);
      modal.close();
      ctx.router.navigate({ type: 'home' });
    },
  );
}
