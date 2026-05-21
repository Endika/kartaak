import type {
  IIssueResolverService,
  IssueResolution,
} from '@domain/ai-generation/services/IIssueResolverService';
import type { Card } from '@domain/study/entities/Card';
import type { CardIssue } from '@domain/study/entities/CardIssue';
import type { AIModelId } from '@domain/study/value-objects/StudyWorkflow';
import type { IApiKeyStorage } from '@infrastructure/storage/ApiKeyStorage';
import {
  EmptyAIResponseError,
  InvalidAIResponseError,
  MissingApiKeyError,
} from '@shared/errors/AppError';
import { buildIssueResolverPrompt } from './clients/prompts/issueResolverPrompt';
import { mapFetchFailure, mapHttpError, safeJson } from './errors';

const GEMINI_MODEL = 'gemini-2.5-flash';
const OPENAI_MODEL = 'gpt-4o-mini';
const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const ANTHROPIC_VERSION = '2023-06-01';

export class IssueResolverRouter implements IIssueResolverService {
  constructor(private readonly apiKeys: IApiKeyStorage) {}

  async resolve(model: AIModelId, card: Card, issue: CardIssue): Promise<IssueResolution> {
    const prompt = buildIssueResolverPrompt(card, issue);
    const raw = await this.dispatch(model, prompt);
    return parseResolution(model, raw);
  }

  private async dispatch(model: AIModelId, prompt: string): Promise<string> {
    const apiKey = this.apiKeys.get(model);
    if (!apiKey) throw new MissingApiKeyError(model);
    if (model === 'gemini') return callGemini(prompt, apiKey);
    if (model === 'openai') return callOpenAI(prompt, apiKey);
    return callAnthropic(prompt, apiKey);
  }
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
      }),
    });
  } catch (cause) {
    throw mapFetchFailure('gemini', cause);
  }
  if (!response.ok) throw mapHttpError('gemini', response, await safeJson(response));
  const data = (await safeJson(response)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  } | null;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new EmptyAIResponseError('gemini');
  return text;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Respond strictly as the JSON object requested. No commentary, no markdown fences.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });
  } catch (cause) {
    throw mapFetchFailure('openai', cause);
  }
  if (!response.ok) throw mapHttpError('openai', response, await safeJson(response));
  const data = (await safeJson(response)) as {
    choices?: Array<{ message?: { content?: string } }>;
  } | null;
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new EmptyAIResponseError('openai');
  return text;
}

async function callAnthropic(prompt: string, apiKey: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        temperature: 0.4,
        system: 'Respond strictly as the JSON object requested. No commentary, no markdown fences.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (cause) {
    throw mapFetchFailure('anthropic', cause);
  }
  if (!response.ok) throw mapHttpError('anthropic', response, await safeJson(response));
  const data = (await safeJson(response)) as {
    content?: Array<{ type: string; text?: string }>;
  } | null;
  const text = data?.content?.find((c) => c.type === 'text')?.text;
  if (!text) throw new EmptyAIResponseError('anthropic');
  return text;
}

function parseResolution(model: AIModelId, raw: string): IssueResolution {
  const jsonText = extractJsonObject(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (cause) {
    throw new InvalidAIResponseError(model, 'response was not valid JSON', cause);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new InvalidAIResponseError(model, 'response was not a JSON object');
  }
  const obj = parsed as Record<string, unknown>;
  const front = String(obj.front ?? '').trim();
  const back = String(obj.back ?? '').trim();
  if (!front || !back) {
    throw new InvalidAIResponseError(model, 'response is missing front or back');
  }
  const rationale =
    typeof obj.rationale === 'string' && obj.rationale.trim().length > 0
      ? obj.rationale.trim()
      : undefined;
  return rationale
    ? { proposedFront: front, proposedBack: back, rationale }
    : { proposedFront: front, proposedBack: back };
}

function extractJsonObject(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return text;
  return text.slice(start, end + 1);
}
