import type { ExistingCardHint } from '@domain/ai-generation/services/ICardGeneratorService';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';

const MAX_EXISTING_HINTS = 100;

export function buildCardPrompt(
  workflow: StudyWorkflow,
  count: number,
  existing: readonly ExistingCardHint[] = [],
): string {
  const topics =
    workflow.topics.length > 0
      ? `Subtopics: ${workflow.topics.join(', ')}`
      : 'Subtopics: (none specified — infer reasonable scope from the theme).';

  const instructions =
    workflow.instructions.trim().length > 0
      ? workflow.instructions.trim()
      : 'No specific format requested — use a clear question/prompt on the front and a concise answer on the back, matched to the theme.';

  const imageGuidance = workflow.includeImages
    ? 'If a public image would clearly aid recall (flags, paintings, anatomy), include an "imageUrl" pointing to a stable Wikimedia Commons or Wikipedia URL. Otherwise omit the field.'
    : 'Do NOT include an "imageUrl" field.';

  const isPreview = count < workflow.quantity;
  const sizeNote = isPreview
    ? [
        `Generate exactly ${count} flashcards as a REPRESENTATIVE PREVIEW of what a full batch of ${workflow.quantity} cards would look like.`,
        'Pick a slice that spans the spread of difficulty and subtopics so the user can judge the full batch from these samples.',
      ].join(' ')
    : `Generate exactly ${count} flashcards.`;

  const lines = [
    'You generate flashcards for a study app. Output strict JSON only — no commentary, no markdown fences.',
    '',
    `Theme: ${workflow.theme}`,
    topics,
    `Generation instructions from the user: ${instructions}`,
    '',
    sizeNote,
    'Each object MUST have:',
    '  - "front": the prompt side (question, term, problem, image cue, etc.) as a string.',
    '  - "back": the answer side as a string.',
    `  - ${imageGuidance}`,
    '',
    'Hard requirements:',
    '  - No duplicates and no near-duplicates within the batch.',
    '  - No numbering prefixes in the text.',
    '  - Keep each side concise and self-contained.',
    '  - Respond with the JSON array only.',
  ];

  if (existing.length > 0) {
    const shown = existing.slice(0, MAX_EXISTING_HINTS);
    const overflow = existing.length - shown.length;
    lines.push(
      '',
      `AVOID THESE — already in the user's deck. Do not repeat them or generate near-duplicates (different wording for the same concept also counts as duplicate):`,
      ...shown.map((c) => `  - ${c.front} | ${c.back}`),
    );
    if (overflow > 0) {
      lines.push(`  (… and ${overflow} more not shown — stay clearly within new territory)`);
    }
  }

  return lines.join('\n');
}
