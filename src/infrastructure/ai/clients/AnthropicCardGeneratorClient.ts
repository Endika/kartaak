import type {
  GeneratedCard,
  ICardGeneratorService,
} from '@domain/ai-generation/services/ICardGeneratorService';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import { AIGenerationError } from '@shared/errors/AppError';
import { buildCardPrompt } from './prompts/cardPrompt';

const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
}

export class AnthropicCardGeneratorClient implements ICardGeneratorService {
  constructor(private readonly apiKeys: IApiKeyStorage) {}

  async generate(workflow: StudyWorkflow, count: number): Promise<GeneratedCard[]> {
    const apiKey = this.apiKeys.get('anthropic');
    if (!apiKey) {
      throw new AIGenerationError('Missing Anthropic API key. Add one in Settings.');
    }

    const prompt = buildCardPrompt(workflow, count);

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
      throw new AIGenerationError('Network error reaching Anthropic', cause);
    }

    if (!response.ok) {
      const body = (await safeJson(response)) as AnthropicResponse | null;
      const reason = body?.error?.message ?? response.statusText;
      throw new AIGenerationError(`Anthropic request failed (${response.status}): ${reason}`);
    }

    const data = (await safeJson(response)) as AnthropicResponse | null;
    const text = data?.content?.find((c) => c.type === 'text')?.text;
    if (!text) {
      throw new AIGenerationError('Anthropic returned an empty response');
    }
    return parseCards(text);
  }
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function parseCards(raw: string): GeneratedCard[] {
  const jsonText = extractJsonArray(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (cause) {
    throw new AIGenerationError('Could not parse Anthropic response as JSON', cause);
  }
  if (!Array.isArray(parsed)) {
    throw new AIGenerationError('Anthropic response was not a JSON array');
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
    throw new AIGenerationError('Anthropic returned no usable cards');
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
