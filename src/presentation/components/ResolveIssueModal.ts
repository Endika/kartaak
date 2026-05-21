import type { ApplyIssueResolutionUseCase } from '@application/use-cases/ApplyIssueResolutionUseCase';
import type { DeleteCardUseCase } from '@application/use-cases/DeleteCardUseCase';
import type { ResolveIssueWithAIUseCase } from '@application/use-cases/ResolveIssueWithAIUseCase';
import type { Card } from '@domain/study/entities/Card';
import type { CardIssue } from '@domain/study/entities/CardIssue';
import type { Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { escapeHtml } from './Layout';
import { openModal } from './Modal';

export interface ResolveIssueModalDeps {
  studies: IStudyRepository;
  resolveIssueWithAI: ResolveIssueWithAIUseCase;
  applyIssueResolution: ApplyIssueResolutionUseCase;
  deleteCard: DeleteCardUseCase;
}

export function openResolveIssueModal(
  deps: ResolveIssueModalDeps,
  study: Study,
  card: Card,
  issue: CardIssue,
  onChanged: (study: Study) => void,
): void {
  let proposedFront = '';
  let proposedBack = '';

  const modal = openModal(
    {
      title: 'Resolve with AI',
      primaryLabel: 'Generate proposal',
      bodyHtml: `
        <div class="space-y-3">
          <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">Front</div>
            <div class="text-sm mb-2">${escapeHtml(card.front)}</div>
            <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">Back</div>
            <div class="text-sm">${escapeHtml(card.back)}</div>
          </div>
          <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <div class="text-xs uppercase tracking-wide text-amber-700 mb-1">Reported issue · ${escapeHtml(issue.type)}</div>
            <div class="text-sm">${escapeHtml(issue.description || '(no description)')}</div>
          </div>
          <p class="text-xs text-slate-500">Will use <strong>${escapeHtml(study.workflow.aiModel)}</strong> (the model this study was created with).</p>
          <div data-proposal class="hidden"></div>
        </div>
      `,
    },
    async () => {
      const proposalEl = modal.root.querySelector<HTMLElement>('[data-proposal]');
      if (proposalEl && !proposalEl.classList.contains('hidden')) {
        modal.setBusy(true, 'Saving…');
        await deps.applyIssueResolution.execute(
          study.id,
          card.id,
          issue.id,
          proposedFront,
          proposedBack,
        );
        const refreshed = await deps.studies.findById(study.id);
        if (refreshed) onChanged(refreshed);
        modal.close();
        return;
      }

      modal.setBusy(true, 'Asking the AI…');
      const resolution = await deps.resolveIssueWithAI.execute(study.id, card.id, issue.id);
      proposedFront = resolution.proposedFront;
      proposedBack = resolution.proposedBack;
      renderProposal(
        modal.root,
        card,
        resolution.proposedFront,
        resolution.proposedBack,
        resolution.rationale,
      );
      modal.setBusy(false);
      const primary =
        modal.root.parentElement?.querySelector<HTMLButtonElement>('[data-modal-primary]');
      if (primary) primary.textContent = 'Accept and apply';
      const deleteBtn = modal.root.querySelector<HTMLButtonElement>('[data-delete-card]');
      deleteBtn?.addEventListener('click', async () => {
        if (!confirm('Delete this card from the study?')) return;
        const next = await deps.deleteCard.execute(study.id, card.id);
        onChanged(next);
        modal.close();
      });
    },
  );
}

function renderProposal(
  dialog: HTMLElement,
  current: Card,
  proposedFront: string,
  proposedBack: string,
  rationale?: string,
): void {
  const target = dialog.querySelector('[data-proposal]');
  if (!target) return;
  target.classList.remove('hidden');
  target.innerHTML = `
    <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 mt-1">
      <div class="text-xs uppercase tracking-wide text-emerald-700 mb-1">Proposed front</div>
      <div class="text-sm mb-2">${escapeHtml(proposedFront)}</div>
      <div class="text-xs uppercase tracking-wide text-emerald-700 mb-1">Proposed back</div>
      <div class="text-sm">${escapeHtml(proposedBack)}</div>
      ${rationale ? `<div class="text-xs text-emerald-700 mt-2 italic">${escapeHtml(rationale)}</div>` : ''}
    </div>
    <div class="flex justify-between items-center mt-3">
      <button data-delete-card type="button" class="text-xs text-danger hover:underline">Delete card instead</button>
      <p class="text-xs text-slate-500">Original kept above. Accept to replace, or Cancel to ignore.</p>
    </div>
  `;
  void current;
}
