import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import type {
  GeneratedCard,
  ICardGeneratorService,
} from '@domain/ai-generation/services/ICardGeneratorService';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import { AIGenerationError } from '@shared/errors/AppError';
import { buildCardPrompt } from './prompts/cardPrompt';

const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

export class GeminiCardGeneratorClient implements ICardGeneratorService {
  constructor(private readonly apiKeys: IApiKeyStorage) {}

  async generate(workflow: StudyWorkflow, count: number): Promise<GeneratedCard[]> {
    const apiKey = this.apiKeys.get('gemini');
    if (!apiKey) {
      throw new AIGenerationError('Missing Gemini API key. Add one in Settings.');
    }

    const prompt = buildCardPrompt(workflow, count);
    const url = `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      });
    } catch (cause) {
      throw new AIGenerationError('Network error reaching Gemini', cause);
    }

    if (!response.ok) {
      const body = await safeJson(response);
      const reason = body?.error?.message ?? response.statusText;
      throw new AIGenerationError(`Gemini request failed (${response.status}): ${reason}`);
    }

    const data = (await safeJson(response)) as GeminiResponse | null;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AIGenerationError('Gemini returned an empty response');
    }

    return parseCards(text);
  }
}

async function safeJson(response: Response): Promise<GeminiResponse | null> {
  try {
    return (await response.json()) as GeminiResponse;
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
    throw new AIGenerationError('Could not parse Gemini response as JSON', cause);
  }
  if (!Array.isArray(parsed)) {
    throw new AIGenerationError('Gemini response was not a JSON array');
  }
  const cards: GeneratedCard[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const front = String((item as Record<string, unknown>).front ?? '').trim();
    const back = String((item as Record<string, unknown>).back ?? '').trim();
    if (!front || !back) continue;
    const imageRaw = (item as Record<string, unknown>).imageUrl;
    const card: GeneratedCard = { front, back };
    if (typeof imageRaw === 'string' && imageRaw.trim().length > 0) {
      card.imageUrl = imageRaw.trim();
    }
    cards.push(card);
  }
  if (cards.length === 0) {
    throw new AIGenerationError('Gemini returned no usable cards');
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
