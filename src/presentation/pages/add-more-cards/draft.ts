import {
  type AIModelId,
  createWorkflow,
  type StudyWorkflow,
} from '@domain/study/value-objects/StudyWorkflow';

export interface Draft {
  topicsRaw: string;
  instructions: string;
  quantity: number;
  aiModel: AIModelId;
}

export function readDraft(root: HTMLElement, current: Draft): Draft {
  return {
    topicsRaw: root.querySelector<HTMLInputElement>('#topics')?.value ?? current.topicsRaw,
    instructions:
      root.querySelector<HTMLTextAreaElement>('#instructions')?.value ?? current.instructions,
    quantity:
      Number(root.querySelector<HTMLInputElement>('#quantity')?.value ?? current.quantity) ||
      current.quantity,
    aiModel:
      (root.querySelector<HTMLInputElement>('#ai-model')?.value as AIModelId) ?? current.aiModel,
  };
}

export function workflowFromDraft(
  theme: string,
  draft: Draft,
  includeImages: boolean,
): StudyWorkflow {
  return createWorkflow({
    theme,
    topics: draft.topicsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    instructions: draft.instructions,
    quantity: draft.quantity,
    includeImages,
    aiModel: draft.aiModel,
  });
}
