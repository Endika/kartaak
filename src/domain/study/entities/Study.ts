import { type DateKey, type ISODate, nowIso } from '@shared/utils/clock';
import { newId } from '@shared/utils/ids';
import { type StudyWorkflow, workflowDisplayName } from '../value-objects/StudyWorkflow';
import type { Card } from './Card';

export interface DailyActivity {
  date: DateKey;
  reviewed: number;
  learnedTransitions: number;
}

export interface Study {
  id: string;
  name: string;
  workflow: StudyWorkflow;
  cards: Card[];
  createdAt: ISODate;
  lastUpdatedAt: ISODate;
  dailyHistory?: DailyActivity[];
}

export function createStudy(workflow: StudyWorkflow, cards: Card[]): Study {
  const now = nowIso();
  return {
    id: newId(),
    name: workflowDisplayName(workflow),
    workflow,
    cards,
    createdAt: now,
    lastUpdatedAt: now,
  };
}

export function replaceCard(study: Study, updated: Card): Study {
  return {
    ...study,
    cards: study.cards.map((c) => (c.id === updated.id ? updated : c)),
    lastUpdatedAt: nowIso(),
  };
}

export function appendCards(study: Study, newCards: Card[]): Study {
  return {
    ...study,
    cards: [...study.cards, ...newCards],
    lastUpdatedAt: nowIso(),
  };
}

export function updateWorkflow(study: Study, workflow: StudyWorkflow): Study {
  return {
    ...study,
    workflow,
    lastUpdatedAt: nowIso(),
  };
}

export function recordDailyActivity(
  study: Study,
  dateKey: DateKey,
  delta: { reviewed: number; learnedTransitions: number },
): Study {
  const history = study.dailyHistory ?? [];
  const existing = history.find((d) => d.date === dateKey);
  const updated: DailyActivity[] = existing
    ? history.map((d) =>
        d.date === dateKey
          ? {
              date: d.date,
              reviewed: d.reviewed + delta.reviewed,
              learnedTransitions: d.learnedTransitions + delta.learnedTransitions,
            }
          : d,
      )
    : [
        ...history,
        { date: dateKey, reviewed: delta.reviewed, learnedTransitions: delta.learnedTransitions },
      ];
  return { ...study, dailyHistory: updated };
}
