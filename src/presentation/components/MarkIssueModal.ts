import type { Container } from '@bootstrap/Container';
import type { Card } from '@domain/study/entities/Card';
import type { CardIssueType } from '@domain/study/entities/CardIssue';
import type { Study } from '@domain/study/entities/Study';
import { openModal } from './Modal';

const ISSUE_TYPES: { value: CardIssueType; label: string }[] = [
  { value: 'incorrect', label: 'The answer is incorrect' },
  { value: 'confusing', label: 'The question is confusing' },
  { value: 'typo', label: 'There is a typo or formatting issue' },
  { value: 'difficulty', label: 'Difficulty is off (too easy / too hard)' },
  { value: 'other', label: 'Something else (describe below)' },
];

export function openMarkIssueModal(
  container: Container,
  study: Study,
  card: Card,
  onSaved: (study: Study) => void,
): void {
  const radios = ISSUE_TYPES.map(
    (t, i) => `
      <label class="flex items-start gap-2 py-1.5 cursor-pointer">
        <input type="radio" name="issue-type" value="${t.value}" ${i === 0 ? 'checked' : ''} class="mt-1" />
        <span class="text-sm">${t.label}</span>
      </label>
    `,
  ).join('');

  const modal = openModal(
    {
      title: 'Report an issue with this card',
      primaryLabel: 'Submit',
      bodyHtml: `
        <div class="space-y-1">${radios}</div>
        <label class="block text-sm font-medium mt-4 mb-1">Description (optional unless "Something else")</label>
        <textarea data-issue-description rows="3"
          class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm"
          placeholder="Anything that would help fix this card later."></textarea>
      `,
    },
    async () => {
      const typeInput = modal.root.querySelector<HTMLInputElement>(
        'input[name="issue-type"]:checked',
      );
      const type = (typeInput?.value as CardIssueType) ?? 'other';
      const description =
        modal.root.querySelector<HTMLTextAreaElement>('[data-issue-description]')?.value ?? '';
      modal.setBusy(true, 'Saving…');
      try {
        const { study: next } = await container.markCardIssue.execute(
          study.id,
          card.id,
          type,
          description,
        );
        modal.close();
        onSaved(next);
      } catch (err) {
        modal.setBusy(false);
        throw err;
      }
    },
  );
}
