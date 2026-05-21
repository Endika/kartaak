import type { Card } from '@domain/study/entities/Card';
import type { CardIssue } from '@domain/study/entities/CardIssue';

export function buildIssueResolverPrompt(card: Card, issue: CardIssue): string {
  const typeLabel: Record<CardIssue['type'], string> = {
    incorrect: 'The answer (back) is wrong',
    confusing: 'The question (front) is confusing or ambiguous',
    typo: 'There is a typo or formatting issue',
    difficulty: 'The difficulty is off (too easy or too hard)',
    other: 'Other issue',
  };

  const description = issue.description.trim().length > 0 ? issue.description.trim() : '(none)';

  return [
    'You are fixing a single flashcard reported by the user.',
    '',
    'Current card:',
    `  front: ${card.front}`,
    `  back:  ${card.back}`,
    '',
    `Reported issue type: ${typeLabel[issue.type]}`,
    `Reported issue description: ${description}`,
    '',
    'Produce an improved version of the card that addresses the issue.',
    'Keep the same theme and difficulty unless the issue explicitly asks for a change.',
    'Both sides must be concise and self-contained.',
    '',
    'Respond with strict JSON only, no markdown, no commentary:',
    '{ "front": string, "back": string, "rationale": string }',
  ].join('\n');
}
