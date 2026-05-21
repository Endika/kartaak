import { ValidationError } from '@shared/errors/AppError';
import { describe, expect, it } from 'vitest';
import { createWorkflow } from '../StudyWorkflow';

const base = {
  theme: 'History',
  topics: [] as string[],
  instructions: '',
  quantity: 10,
  includeImages: false,
  aiModel: 'gemini' as const,
};

describe('createWorkflow', () => {
  it('rejects themes shorter than the minimum after trimming', () => {
    expect(() => createWorkflow({ ...base, theme: ' a ' })).toThrow(ValidationError);
  });

  it('rejects quantities below the minimum', () => {
    expect(() => createWorkflow({ ...base, quantity: 1 })).toThrow(ValidationError);
  });

  it('rejects quantities above the maximum', () => {
    expect(() => createWorkflow({ ...base, quantity: 1001 })).toThrow(ValidationError);
  });

  it('rejects non-finite quantities', () => {
    expect(() => createWorkflow({ ...base, quantity: Number.NaN })).toThrow(ValidationError);
  });

  it('trims theme and topics, drops empty topics, floors quantity', () => {
    const w = createWorkflow({
      ...base,
      theme: '  Geography  ',
      topics: [' Europe ', '', '  ', 'Asia'],
      quantity: 25.7,
    });
    expect(w.theme).toBe('Geography');
    expect(w.topics).toEqual(['Europe', 'Asia']);
    expect(w.quantity).toBe(25);
  });
});
