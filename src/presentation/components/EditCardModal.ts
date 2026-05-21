import type { EditCardUseCase } from '@application/use-cases/EditCardUseCase';
import type { Card } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import type { I18n } from '@shared/i18n';
import { escapeHtml } from './Layout';
import { openModal } from './Modal';

export interface EditCardModalDeps {
  editCard: EditCardUseCase;
  i18n: I18n;
}

export function openEditCardModal(
  deps: EditCardModalDeps,
  study: Study,
  card: Card,
  onSaved: (study: Study) => void,
): void {
  const { i18n } = deps;
  const modal = openModal(
    {
      title: i18n.t('editCardModal.title'),
      primaryLabel: i18n.t('editCardModal.primary'),
      secondaryLabel: i18n.t('app.cancel'),
      bodyHtml: `
        <label class="block text-sm font-medium mb-1">${i18n.t('editCardModal.front')}</label>
        <textarea data-edit-front rows="3"
          class="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm">${escapeHtml(card.front)}</textarea>
        <label class="block text-sm font-medium mb-1">${i18n.t('editCardModal.back')}</label>
        <textarea data-edit-back rows="3"
          class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm">${escapeHtml(card.back)}</textarea>
      `,
    },
    async () => {
      const front = modal.root.querySelector<HTMLTextAreaElement>('[data-edit-front]')?.value ?? '';
      const back = modal.root.querySelector<HTMLTextAreaElement>('[data-edit-back]')?.value ?? '';
      modal.setBusy(true, i18n.t('editCardModal.saving'));
      try {
        const next = await deps.editCard.execute(study.id, card.id, front, back);
        modal.close();
        onSaved(next);
      } catch (err) {
        modal.setBusy(false);
        throw err;
      }
    },
  );
}
