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

  return {
    total,
    newCount,
    learning,
    learned,
    learnedPct,
    streakDays: computeStreak(byDate),
    reviewedLast30Days: daily.reduce((acc, d) => acc + d.reviewed, 0),
    daily,
  };
}

function computeStreak(byDate: Map<DateKey, DailyActivity>): number {
  let streak = 0;
  const today = todayKey();
  const todayEntry = byDate.get(today);
  let cursor = today;
  if (!todayEntry || todayEntry.reviewed === 0) {
    cursor = dayKeyAt(-1);
    const yesterday = byDate.get(cursor);
    if (!yesterday || yesterday.reviewed === 0) return 0;
  }
  for (let offset = 0; offset < 365; offset++) {
    const key = cursor === today ? today : dayKeyAt(-offset);
    const entry = byDate.get(key);
    if (!entry || entry.reviewed === 0) break;
    streak++;
    cursor = dayKeyAt(-(offset + 1));
  }
  return streak;
}
