import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';

export function buildCardPrompt(workflow: StudyWorkflow, count: number): string {
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

  return [
    'You generate flashcards for a study app. Output strict JSON only — no commentary, no markdown fences.',
    '',
    `Theme: ${workflow.theme}`,
    topics,
    `Generation instructions from the user: ${instructions}`,
    '',
    `Generate exactly ${count} flashcard objects in a JSON array.`,
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
  ].join('\n');
}
