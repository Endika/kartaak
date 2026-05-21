import type {
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

const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export class OpenAICardGeneratorClient implements ICardGeneratorService {
  constructor(private readonly apiKeys: IApiKeyStorage) {}

  async generate(workflow: StudyWorkflow, count: number): Promise<GeneratedCard[]> {
    const apiKey = this.apiKeys.get('openai');
    if (!apiKey) throw new MissingApiKeyError('openai');

    const prompt = buildCardPrompt(workflow, count);

    let response: Response;
    try {
      response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.7,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You return a JSON object with a single "cards" array. Each item is { "front": string, "back": string, "imageUrl"?: string }. No extra commentary.',
            },
            { role: 'user', content: prompt },
          ],
        }),
      });
    } catch (cause) {
      throw mapFetchFailure('openai', cause);
    }

    if (!response.ok) {
      throw mapHttpError('openai', response, await safeJson(response));
    }

    const data = (await safeJson(response)) as OpenAIResponse | null;
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new EmptyAIResponseError('openai');
    return extractCards(text);
  }
}

function extractCards(text: string): GeneratedCard[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    throw new InvalidAIResponseError('openai', 'response was not valid JSON', cause);
  }
  const list =
    Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : Array.isArray((parsed as Record<string, unknown> | null)?.cards)
        ? ((parsed as Record<string, unknown>).cards as unknown[])
        : null;
  if (!list) {
    throw new InvalidAIResponseError('openai', 'response did not contain a cards array');
  }

  const cards: GeneratedCard[] = [];
  for (const item of list) {
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
    throw new InvalidAIResponseError('openai', 'no usable cards in array');
  }
  return cards;
}
