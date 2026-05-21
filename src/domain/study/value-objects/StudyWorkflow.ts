import { ValidationError } from '@shared/errors/AppError';

export type AIModelId = 'gemini' | 'openai' | 'anthropic';

export interface StudyWorkflow {
  readonly theme: string;
  readonly topics: readonly string[];
  readonly instructions: string;
  readonly quantity: number;
  readonly includeImages: boolean;
  readonly aiModel: AIModelId;
}

const MIN_THEME_LENGTH = 2;
const MIN_QUANTITY = 4;
const MAX_QUANTITY = 1000;

export function createWorkflow(input: {
  theme: string;
  topics: readonly string[];
  instructions: string;
  quantity: number;
  includeImages: boolean;
  aiModel: AIModelId;
}): StudyWorkflow {
  const theme = input.theme.trim();
  if (theme.length < MIN_THEME_LENGTH) {
    throw new ValidationError(`Theme must be at least ${MIN_THEME_LENGTH} characters`);
  }
  if (
    !Number.isFinite(input.quantity) ||
    input.quantity < MIN_QUANTITY ||
    input.quantity > MAX_QUANTITY
  ) {
    throw new ValidationError(`Quantity must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}`);
  }
  return {
    theme,
    topics: input.topics.map((t) => t.trim()).filter((t) => t.length > 0),
    instructions: input.instructions.trim(),
    quantity: Math.floor(input.quantity),
    includeImages: input.includeImages,
    aiModel: input.aiModel,
  };
}

export function workflowDisplayName(w: StudyWorkflow): string {
  const topics = w.topics.length > 0 ? ` — ${w.topics.slice(0, 3).join(', ')}` : '';
  return `${w.theme}${topics}`;
}
