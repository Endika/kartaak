import type { StudyStatsSnapshot } from '@domain/study/services/studyStats';
import type { I18n } from '@shared/i18n';
import { escapeHtml } from './Layout';

export function renderStudyStats(stats: StudyStatsSnapshot, i18n: I18n): string {
  return `
    <section class="grid gap-4 lg:grid-cols-2 mb-6">
      ${renderDonut(stats, i18n)}
      ${renderTrend(stats, i18n)}
    </section>

    <section class="rounded-xl border border-slate-200 bg-white p-4 mb-6">
      <h2 class="font-semibold text-sm mb-3">${i18n.t('stats.activityHeading')}</h2>
      ${renderHeatmap(stats)}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
        ${miniMetric(i18n.t('stats.metrics.streak'), i18n.t('stats.metrics.streakUnit', { days: stats.streakDays }))}
        ${miniMetric(i18n.t('stats.metrics.daysStudied'), String(stats.daysStudiedTotal))}
        ${miniMetric(i18n.t('stats.metrics.avgActiveDay'), stats.avgPerActiveDay.toString())}
        ${miniMetric(
          i18n.t('stats.metrics.bestDay'),
          stats.bestDay
            ? `${stats.bestDay.reviewed} · ${formatShortDate(stats.bestDay.date)}`
            : '—',
        )}
      </div>
    </section>
  `;
}

function renderDonut(stats: StudyStatsSnapshot, i18n: I18n): string {
  const total = stats.total;
  if (total === 0) {
    return `
      <div class="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-center min-h-[180px] text-sm text-slate-400">
        ${i18n.t('stats.noCards')}
      </div>
    `;
  }

  const circumference = 2 * Math.PI * 56;
  const segments = [
    { label: i18n.t('stats.distribution.new'), value: stats.newCount, color: '#0ea5e9' },
    { label: i18n.t('stats.distribution.learning'), value: stats.learning, color: '#f59e0b' },
    { label: i18n.t('stats.distribution.learned'), value: stats.learned, color: '#10b981' },
  ];

  let offset = 0;
  const arcs = segments
    .map((seg) => {
      const fraction = seg.value / total;
      const length = circumference * fraction;
      const dasharray = `${length} ${circumference - length}`;
      const dashoffset = -offset;
      offset += length;
      if (seg.value === 0) return '';
      return `
        <circle cx="80" cy="80" r="56" fill="transparent"
                stroke="${seg.color}" stroke-width="20"
                stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}"
                transform="rotate(-90 80 80)" />
      `;
    })
    .join('');

  const legend = segments
    .map(
      (seg) => `
      <li class="flex items-center justify-between text-sm">
        <span class="flex items-center gap-2">
          <span class="inline-block h-2.5 w-2.5 rounded-sm" style="background:${seg.color}"></span>
          ${escapeHtml(seg.label)}
        </span>
        <span class="text-slate-500">${seg.value}</span>
      </li>
    `,
    )
    .join('');

  return `
    <div class="rounded-xl border border-slate-200 bg-white p-4">
      <h2 class="font-semibold text-sm mb-3">${i18n.t('stats.cardStatusHeading')}</h2>
      <div class="flex items-center gap-4">
        <svg viewBox="0 0 160 160" class="w-32 h-32 shrink-0" aria-label="${i18n.t('stats.donutAria')}">
          ${arcs}
          <text x="80" y="76" text-anchor="middle" font-size="22" font-weight="600" fill="#0f172a">${stats.learnedPct}%</text>
          <text x="80" y="98" text-anchor="middle" font-size="11" fill="#64748b">${i18n.t('stats.donutCenterLabel')}</text>
        </svg>
        <ul class="flex-1 space-y-1.5">${legend}</ul>
      </div>
    </div>
  `;
}

function renderTrend(stats: StudyStatsSnapshot, i18n: I18n): string {
  const max = Math.max(1, ...stats.daily.map((d) => d.reviewed));
  const width = 300;
  const height = 120;
  const padding = { top: 8, right: 4, bottom: 16, left: 4 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barGap = 2;
  const barW = (chartW - barGap * (stats.daily.length - 1)) / stats.daily.length;

  const bars = stats.daily
    .map((d, i) => {
      const x = padding.left + i * (barW + barGap);
      const h = (d.reviewed / max) * chartH;
      const y = padding.top + (chartH - h);
      const colour = d.reviewed === 0 ? '#e2e8f0' : '#10b981';
      return `
        <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${Math.max(h, 1).toFixed(2)}"
              fill="${colour}" rx="1">
          <title>${d.date} · ${d.reviewed} reviewed${d.learnedTransitions > 0 ? ` · ${d.learnedTransitions} learned` : ''}</title>
        </rect>
      `;
    })
    .join('');

  const firstLabel = formatShortDate(stats.daily[0]?.date ?? '');
  const lastLabel = formatShortDate(stats.daily[stats.daily.length - 1]?.date ?? '');

  return `
    <div class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-sm">${i18n.t('stats.reviewedHeading')}</h2>
        <span class="text-xs text-slate-500">${i18n.t('stats.totalReviewed', { count: stats.reviewedLast30Days })}</span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-32" preserveAspectRatio="none">
        ${bars}
        <text x="${padding.left}" y="${height - 2}" font-size="10" fill="#94a3b8">${escapeHtml(firstLabel)}</text>
        <text x="${width - padding.right}" y="${height - 2}" font-size="10" fill="#94a3b8" text-anchor="end">${escapeHtml(lastLabel)}</text>
      </svg>
    </div>
  `;
}

function renderHeatmap(stats: StudyStatsSnapshot): string {
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
    <div class="grid gap-1" style="grid-template-columns: repeat(30, minmax(0, 1fr));">${cells}</div>
  `;
}

function miniMetric(label: string, value: string): string {
  return `
    <div>
      <div class="text-xs uppercase tracking-wide text-slate-400">${escapeHtml(label)}</div>
      <div class="font-semibold text-slate-900">${escapeHtml(value)}</div>
    </div>
  `;
}

function formatShortDate(key: string): string {
  if (!key) return '';
  const [_year, month, day] = key.split('-');
  return `${day}/${month}`;
}
