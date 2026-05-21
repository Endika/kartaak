import type {
  ExistingCardHint,
  GeneratedCard,
  ICardGeneratorService,
} from '@domain/ai-generation/services/ICardGeneratorService';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import {
  EmptyAIResponseError,
  InvalidAIResponseError,
  MissingApiKeyError,
} from '@shared/errors/AppError';
import { mapFetchFailure, mapHttpError, safeJson } from '../errors';
import { buildCardPrompt } from './prompts/cardPrompt';

const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
}

export class AnthropicCardGeneratorClient implements ICardGeneratorService {
  constructor(private readonly apiKeys: IApiKeyStorage) {}

  async generate(
    workflow: StudyWorkflow,
    count: number,
    existing: readonly ExistingCardHint[] = [],
  ): Promise<GeneratedCard[]> {
    const apiKey = this.apiKeys.get('anthropic');
    if (!apiKey) throw new MissingApiKeyError('anthropic');

    const prompt = buildCardPrompt(workflow, count, existing);

    let response: Response;
    try {
      response = await fetch(ANTHROPIC_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 4096,
          temperature: 0.7,
          system:
            'You generate flashcards. Reply with a JSON array only — each element { "front": string, "back": string, "imageUrl"?: string }. No commentary, no markdown fences.',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch (cause) {
      throw mapFetchFailure('anthropic', cause);
    }

    if (!response.ok) {
      throw mapHttpError('anthropic', response, await safeJson(response));
    }

    const data = (await safeJson(response)) as AnthropicResponse | null;
    const text = data?.content?.find((c) => c.type === 'text')?.text;
    if (!text) throw new EmptyAIResponseError('anthropic');
    return parseCards(text);
  }
}

function parseCards(raw: string): GeneratedCard[] {
  const jsonText = extractJsonArray(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (cause) {
    throw new InvalidAIResponseError('anthropic', 'response was not valid JSON', cause);
  }
  if (!Array.isArray(parsed)) {
    throw new InvalidAIResponseError('anthropic', 'response was not a JSON array');
  }
  const cards: GeneratedCard[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const front = String(obj.front ?? '').trim();
    const back = String(obj.back ?? '').trim();
    if (!front || !back) continue;
    const card: GeneratedCard = { front, back };
    if (typeof obj.imageUrl === 'string' && obj.imageUrl.trim().length > 0) {
      card.imageUrl = obj.imageUrl.trim();
    }
    cards.push(card);
  }
  if (cards.length === 0) {
    throw new InvalidAIResponseError('anthropic', 'no usable cards in array');
  }
  return cards;
}

function extractJsonArray(text: string): string {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    return text;
  }
  return text.slice(start, end + 1);
}
