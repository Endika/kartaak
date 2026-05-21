import { newId } from '@shared/utils/ids';
import { type ISODate, nowIso } from '@shared/utils/clock';
import type { Card } from './Card';
import { type StudyWorkflow, workflowDisplayName } from '../value-objects/StudyWorkflow';

export interface Study {
  id: string;
  name: string;
  workflow: StudyWorkflow;
  cards: Card[];
  createdAt: ISODate;
  lastUpdatedAt: ISODate;
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
