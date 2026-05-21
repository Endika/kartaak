import type { Card } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { cardFingerprint } from '@domain/study/services/cardDeduplication';
import { AppError } from '@shared/errors/AppError';
import { nowIso } from '@shared/utils/clock';

export interface DedupeStudyCardsResult {
  study: Study;
  removed: number;
  groupsCollapsed: number;
}

export interface DedupePreview {
  totalCards: number;
  uniqueGroups: number;
  duplicatesToRemove: number;
}

export class DedupeStudyCardsUseCase {
  constructor(private readonly studies: IStudyRepository) {}

  async preview(studyId: string): Promise<DedupePreview> {
    const study = await this.loadStudy(studyId);
    const groups = groupByFingerprint(study.cards);
    let duplicatesToRemove = 0;
    for (const group of groups.values()) {
      if (group.length > 1) duplicatesToRemove += group.length - 1;
    }
    return {
      totalCards: study.cards.length,
      uniqueGroups: groups.size,
      duplicatesToRemove,
    };
  }

  async execute(studyId: string): Promise<DedupeStudyCardsResult> {
    const study = await this.loadStudy(studyId);
    const groups = groupByFingerprint(study.cards);
    const kept: Card[] = [];
    let removed = 0;
    let groupsCollapsed = 0;
    for (const group of groups.values()) {
      if (group.length === 1) {
        kept.push(group[0]!);
        continue;
      }
      groupsCollapsed++;
      removed += group.length - 1;
      kept.push(pickWinner(group));
    }
    if (removed === 0) {
      return { study, removed: 0, groupsCollapsed: 0 };
    }
    const next: Study = { ...study, cards: kept, lastUpdatedAt: nowIso() };
    await this.studies.save(next);
    return { study: next, removed, groupsCollapsed };
  }

  private async loadStudy(studyId: string): Promise<Study> {
    const study = await this.studies.findById(studyId);
    if (!study) throw new AppError(`Study ${studyId} not found`);
    return study;
  }
}

function groupByFingerprint(cards: readonly Card[]): Map<string, Card[]> {
  const groups = new Map<string, Card[]>();
  for (const card of cards) {
    const key = cardFingerprint(card);
    const bucket = groups.get(key);
    if (bucket) bucket.push(card);
    else groups.set(key, [card]);
  }
  return groups;
}

function pickWinner(group: Card[]): Card {
  return [...group].sort((a, b) => {
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.createdAt.localeCompare(b.createdAt);
  })[0]!;
}
