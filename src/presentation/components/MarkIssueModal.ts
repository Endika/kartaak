import type { MarkCardIssueUseCase } from '@application/use-cases/MarkCardIssueUseCase';
import type { Card } from '@domain/study/entities/Card';
import type { CardIssueType } from '@domain/study/entities/CardIssue';
import type { Study } from '@domain/study/entities/Study';
import type { I18n } from '@shared/i18n';
import { openModal } from './Modal';

export interface MarkIssueModalDeps {
  markCardIssue: MarkCardIssueUseCase;
  i18n: I18n;
}

const ISSUE_TYPES: CardIssueType[] = ['incorrect', 'confusing', 'typo', 'difficulty', 'other'];

export function openMarkIssueModal(
  deps: MarkIssueModalDeps,
  study: Study,
  card: Card,
  onSaved: (study: Study) => void,
): void {
  const { i18n } = deps;
  const radios = ISSUE_TYPES.map(
    (type, i) => `
      <label class="flex items-start gap-2 py-1.5 cursor-pointer">
        <input type="radio" name="issue-type" value="${type}" ${i === 0 ? 'checked' : ''} class="mt-1" />
        <span class="text-sm">${i18n.t(`issueType.${type}`)}</span>
      </label>
    `,
  ).join('');

  const modal = openModal(
    {
      title: i18n.t('markIssueModal.title'),
      primaryLabel: i18n.t('markIssueModal.primary'),
      secondaryLabel: i18n.t('app.cancel'),
      bodyHtml: `
        <div class="space-y-1">${radios}</div>
        <label class="block text-sm font-medium mt-4 mb-1">${i18n.t('markIssueModal.descriptionLabel')}</label>
        <textarea data-issue-description rows="3"
          class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm"
          placeholder="${i18n.t('markIssueModal.descriptionPlaceholder')}"></textarea>
      `,
    },
    async () => {
      const typeInput = modal.root.querySelector<HTMLInputElement>(
        'input[name="issue-type"]:checked',
      );
      const type = (typeInput?.value as CardIssueType) ?? 'other';
      const description =
        modal.root.querySelector<HTMLTextAreaElement>('[data-issue-description]')?.value ?? '';
      modal.setBusy(true, i18n.t('markIssueModal.saving'));
      try {
        const { study: next } = await deps.markCardIssue.execute(
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
