import type { Card } from '@domain/study/entities/Card';
import { pendingIssueCount } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import type { StudyStatsSnapshot } from '@domain/study/services/studyStats';
import { escapeHtml } from '../../components/Layout';

export function renderStudyDetailView(
  study: Study,
  stats: StudyStatsSnapshot,
  issuesCount: number,
  renderStudyStatsSnapshot: (stats: StudyStatsSnapshot) => string,
): string {
  return `
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
      ${statTile('Total', String(stats.total), 'slate')}
      ${statTile('New', String(stats.newCount), 'sky')}
      ${statTile('Learning', String(stats.learning), 'amber')}
      ${statTile('Learned', `${stats.learned} (${stats.learnedPct}%)`, 'emerald')}
    </section>

    ${renderStudyStatsSnapshot(stats)}

    <section class="flex flex-wrap gap-2 mb-6">
      <button id="action-study" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">▶ Study</button>
      <button id="action-add-more" class="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition">+ Add more</button>
      <button id="action-export" class="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100 transition">📤 Export</button>
      <button id="action-delete" class="px-4 py-2 rounded-lg border border-red-200 text-sm text-danger hover:bg-red-50 transition ml-auto">🗑 Delete</button>
    </section>

    ${issuesCount > 0 ? renderIssuesSection(study) : ''}

    <section>
      <h2 class="font-semibold mb-3">Cards <span class="text-slate-400 font-normal">(${stats.total})</span></h2>
      <ul class="space-y-2">
        ${study.cards.map((c, i) => cardRow(c, i)).join('')}
      </ul>
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
