import type { AIModelId } from '@domain/study/value-objects/StudyWorkflow';

export interface ModelOption {
  id: AIModelId;
  label: string;
  hint: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gemini', label: 'Gemini', hint: 'gemini-2.5-flash · cheapest, works browser-direct' },
  { id: 'anthropic', label: 'Claude', hint: 'claude-haiku-4-5 · works browser-direct via header' },
  { id: 'openai', label: 'OpenAI', hint: 'gpt-4o-mini · CORS-blocked from browsers, needs proxy' },
];
