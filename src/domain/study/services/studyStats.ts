import { type DateKey, dayKeyAt, todayKey } from '@shared/utils/clock';
import type { DailyActivity, Study } from '../entities/Study';

export interface StudyStatsSnapshot {
  total: number;
  newCount: number;
  learning: number;
  learned: number;
  learnedPct: number;
  streakDays: number;
  reviewedLast30Days: number;
  daysStudiedTotal: number;
  avgPerActiveDay: number;
  bestDay: { date: DateKey; reviewed: number } | null;
  daily: { date: DateKey; reviewed: number; learnedTransitions: number }[];
}

export function computeStats(study: Study, days = 30): StudyStatsSnapshot {
  const total = study.cards.length;
  const learned = study.cards.filter((c) => c.status === 'learned').length;
  const learning = study.cards.filter((c) => c.status === 'learning').length;
  const newCount = study.cards.filter((c) => c.status === 'new').length;
  const learnedPct = total === 0 ? 0 : Math.round((learned / total) * 100);

  const history = study.dailyHistory ?? [];
  const byDate = new Map<DateKey, DailyActivity>(history.map((d) => [d.date, d]));

  const daily: StudyStatsSnapshot['daily'] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = dayKeyAt(-i);
    const entry = byDate.get(date);
    daily.push({
      date,
      reviewed: entry?.reviewed ?? 0,
      learnedTransitions: entry?.learnedTransitions ?? 0,
    });
  }

  const activeDays = history.filter((d) => d.reviewed > 0);
  const reviewedTotal = history.reduce((acc, d) => acc + d.reviewed, 0);
  const bestDayEntry = activeDays.reduce<DailyActivity | null>(
    (best, d) => (best && best.reviewed >= d.reviewed ? best : d),
    null,
  );

  return {
    total,
    newCount,
    learning,
    learned,
    learnedPct,
    streakDays: computeStreak(byDate),
    reviewedLast30Days: daily.reduce((acc, d) => acc + d.reviewed, 0),
    daysStudiedTotal: activeDays.length,
    avgPerActiveDay:
      activeDays.length === 0 ? 0 : Math.round((reviewedTotal / activeDays.length) * 10) / 10,
    bestDay: bestDayEntry ? { date: bestDayEntry.date, reviewed: bestDayEntry.reviewed } : null,
    daily,
  };
}

function computeStreak(byDate: Map<DateKey, DailyActivity>): number {
  let streak = 0;
  // If today has no activity yet, the streak (if any) ends yesterday — start there.
  const todayEntry = byDate.get(todayKey());
  let offset = todayEntry && todayEntry.reviewed > 0 ? 0 : 1;
  for (; offset < 365; offset++) {
    const entry = byDate.get(dayKeyAt(-offset));
    if (!entry || entry.reviewed === 0) break;
    streak++;
  }
  return streak;
}
