import type { Card } from '@domain/study/entities/Card';
import { pendingIssueCount } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import { computeStats, type StudyStatsSnapshot } from '@domain/study/services/studyStats';
import type { PageContext } from '../AppRouter';
import { openEditCardModal } from '../components/EditCardModal';
import { appShell, escapeHtml } from '../components/Layout';
import { openModal } from '../components/Modal';
import { openResolveIssueModal } from '../components/ResolveIssueModal';

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
  const stats = computeStats(study);
  const total = stats.total;
  const issuesCount = study.cards.reduce((acc, c) => acc + pendingIssueCount(c), 0);

  root.innerHTML = appShell(
    `
    <header class="mb-6">
      <div class="flex items-start justify-between gap-3 mb-1">
        <h1 class="text-2xl font-bold">${escapeHtml(study.name)}</h1>
        <button id="rename-btn" class="text-sm text-slate-400 hover:text-primary transition shrink-0" aria-label="Rename study">✏️ Rename</button>
      </div>
      <p class="text-sm text-slate-500">
        ${escapeHtml(study.workflow.theme)}
        ${study.workflow.topics.length > 0 ? ` · ${escapeHtml(study.workflow.topics.join(', '))}` : ''}
        · model: ${escapeHtml(study.workflow.aiModel)}
      </p>
    </header>

    <section class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      ${statTile('Total', String(total), 'slate')}
      ${statTile('New', String(stats.newCount), 'sky')}
      ${statTile('Learning', String(stats.learning), 'amber')}
      ${statTile('Learned', `${stats.learned} (${stats.learnedPct}%)`, 'emerald')}
    </section>

    ${renderProgressBlock(stats)}

    <section class="flex flex-wrap gap-2 mb-6">
      <button id="action-study" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">▶ Study</button>
      <button id="action-add-more" class="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition">+ Add more</button>
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

  root.querySelector('#rename-btn')?.addEventListener('click', () => {
    openRenameModal(ctx, study, (next) => paint(root, ctx, next));
  });

  root.querySelector('#action-add-more')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'add-more-cards', studyId: study.id });
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
      root.querySelector(`[data-issue-ai="${issue.id}"]`)?.addEventListener('click', () => {
        openResolveIssueModal(ctx.container, study, card, issue, (next) => paint(root, ctx, next));
      });
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

function renderProgressBlock(stats: StudyStatsSnapshot): string {
  const max = Math.max(1, ...stats.daily.map((d) => d.reviewed));
  const cells = stats.daily
    .map((d) => {
      const intensity = d.reviewed === 0 ? 0 : Math.min(4, Math.ceil((d.reviewed / max) * 4));
      const palette = [
        'bg-slate-100',
        'bg-emerald-200',
        'bg-emerald-300',
        'bg-emerald-400',
        'bg-emerald-600',
      ];
      const title = `${d.date} · ${d.reviewed} reviewed${d.learnedTransitions > 0 ? ` · ${d.learnedTransitions} learned` : ''}`;
      return `<div class="h-4 rounded-sm ${palette[intensity]}" title="${title}"></div>`;
    })
    .join('');

  return `
    <section class="rounded-xl border border-slate-200 bg-white p-4 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-sm">Activity · last 30 days</h2>
        <div class="text-xs text-slate-500">
          <strong class="text-base text-slate-900">${stats.streakDays}</strong>
          day${stats.streakDays === 1 ? '' : 's'} streak ·
          <strong class="text-base text-slate-900">${stats.reviewedLast30Days}</strong>
          reviewed
        </div>
      </div>
      <div class="grid grid-cols-15 sm:grid-cols-30 gap-1" style="grid-template-columns: repeat(30, minmax(0, 1fr));">
        ${cells}
      </div>
    </section>
  `;
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
          <div class="flex flex-wrap gap-2">
            <button data-issue-ai="${issue.id}" data-card-id="${card.id}" class="text-xs px-2.5 py-1 rounded bg-primary text-white hover:opacity-90 transition">🤖 Resolve with AI</button>
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

function openRenameModal(ctx: PageContext, study: Study, onRenamed: (study: Study) => void): void {
  const modal = openModal(
    {
      title: 'Rename study',
      primaryLabel: 'Save',
      bodyHtml: `
        <input data-rename-input type="text" value="${escapeHtml(study.name)}"
               class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm" />
      `,
    },
    async () => {
      const value = modal.root.querySelector<HTMLInputElement>('[data-rename-input]')?.value ?? '';
      modal.setBusy(true, 'Saving…');
      try {
        const next = await ctx.container.renameStudy.execute(study.id, value);
        modal.close();
        onRenamed(next);
      } catch (err) {
        modal.setBusy(false);
        throw err;
      }
    },
  );
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
