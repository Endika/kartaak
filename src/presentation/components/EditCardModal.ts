import type { Container } from '@bootstrap/Container';
import type { Card } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import { escapeHtml } from './Layout';
import { openModal } from './Modal';

export function openEditCardModal(
  container: Container,
  study: Study,
  card: Card,
  onSaved: (study: Study) => void,
): void {
  const modal = openModal(
    {
      title: 'Edit card',
      primaryLabel: 'Save changes',
      bodyHtml: `
        <label class="block text-sm font-medium mb-1">Front</label>
        <textarea data-edit-front rows="3"
          class="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm">${escapeHtml(card.front)}</textarea>
        <label class="block text-sm font-medium mb-1">Back</label>
        <textarea data-edit-back rows="3"
          class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm">${escapeHtml(card.back)}</textarea>
      `,
    },
    async () => {
      const front = modal.root.querySelector<HTMLTextAreaElement>('[data-edit-front]')?.value ?? '';
      const back = modal.root.querySelector<HTMLTextAreaElement>('[data-edit-back]')?.value ?? '';
      modal.setBusy(true, 'Saving…');
      try {
        const next = await container.editCard.execute(study.id, card.id, front, back);
        modal.close();
        onSaved(next);
      } catch (err) {
        modal.setBusy(false);
        throw err;
      }
    },
  );
}
