import type { ApplyIssueResolutionUseCase } from '@application/use-cases/ApplyIssueResolutionUseCase';
import type { DedupeStudyCardsUseCase } from '@application/use-cases/DedupeStudyCardsUseCase';
import type { DeleteCardUseCase } from '@application/use-cases/DeleteCardUseCase';
import type { DeleteStudyUseCase } from '@application/use-cases/DeleteStudyUseCase';
import type { EditCardUseCase } from '@application/use-cases/EditCardUseCase';
import type { ExportStudyUseCase } from '@application/use-cases/ExportStudyUseCase';
import type { RenameStudyUseCase } from '@application/use-cases/RenameStudyUseCase';
import type { ResolveIssueWithAIUseCase } from '@application/use-cases/ResolveIssueWithAIUseCase';
import type { UpdateIssueStatusUseCase } from '@application/use-cases/UpdateIssueStatusUseCase';
import { pendingIssueCount } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import type { IStudyRepository } from '@domain/study/repositories/IStudyRepository';
import { computeStats } from '@domain/study/services/studyStats';
import type { I18n } from '@shared/i18n';
import type { PageContext } from '../AppRouter';
import { openEditCardModal } from '../components/EditCardModal';
import { appShell, escapeHtml } from '../components/Layout';
import { openModal } from '../components/Modal';
import { openResolveIssueModal } from '../components/ResolveIssueModal';
import { renderStudyStats } from '../components/StudyStats';
import { renderStudyDetailView } from './study-detail/view';

export interface StudyDetailPageDeps {
  studies: IStudyRepository;
  renameStudy: RenameStudyUseCase;
  deleteStudy: DeleteStudyUseCase;
  exportStudy: ExportStudyUseCase;
  updateIssueStatus: UpdateIssueStatusUseCase;
  editCard: EditCardUseCase;
  resolveIssueWithAI: ResolveIssueWithAIUseCase;
  applyIssueResolution: ApplyIssueResolutionUseCase;
  deleteCard: DeleteCardUseCase;
  dedupeStudyCards: DedupeStudyCardsUseCase;
  i18n: I18n;
}

type Ctx = PageContext<StudyDetailPageDeps>;

export async function renderStudyDetailPage(
  root: HTMLElement,
  ctx: Ctx,
  studyId: string,
): Promise<void> {
  const { i18n } = ctx.deps;
  const study = await ctx.deps.studies.findById(studyId);
  if (!study) {
    root.innerHTML = appShell(
      `<p class="text-sm text-slate-500">${i18n.t('studyDetail.notFound')}</p>`,
      { back: { label: i18n.t('studyDetail.backHome'), onBackId: 'back-home' } },
    );
    root.querySelector('#back-home')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'home' });
    });
    return;
  }

  paint(root, ctx, study);
}

function paint(root: HTMLElement, ctx: Ctx, study: Study): void {
  const { i18n } = ctx.deps;
  const stats = computeStats(study);
  const issuesCount = study.cards.reduce((acc, c) => acc + pendingIssueCount(c), 0);
  const repaint = (next: Study): void => paint(root, ctx, next);

  root.innerHTML = appShell(
    renderStudyDetailView(study, stats, issuesCount, (s) => renderStudyStats(s, i18n), i18n),
    { back: { label: i18n.t('studyDetail.back'), onBackId: 'back-home' } },
  );

  wireHeader(root, ctx, study, repaint);
  wireActions(root, ctx, study, repaint);
  wireCards(root, ctx, study, repaint);
  wireIssues(root, ctx, study, repaint);
}

function wireHeader(root: HTMLElement, ctx: Ctx, study: Study, repaint: (s: Study) => void): void {
  root.querySelector('#back-home')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'home' });
  });
  root.querySelector('#rename-btn')?.addEventListener('click', () => {
    openRenameModal(ctx, study, repaint);
  });
}

function wireActions(root: HTMLElement, ctx: Ctx, study: Study, repaint: (s: Study) => void): void {
  root.querySelector('#action-study')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'study', study });
  });
  root.querySelector('#action-add-more')?.addEventListener('click', () => {
    ctx.router.navigate({ type: 'add-more-cards', studyId: study.id });
  });
  root.querySelector('#action-export')?.addEventListener('click', () => {
    void exportStudy(ctx, study);
  });
  root.querySelector('#action-dedupe')?.addEventListener('click', () => {
    void openDedupeModal(ctx, study, repaint);
  });
  root.querySelector('#action-delete')?.addEventListener('click', () => {
    confirmDelete(ctx, study);
  });
}

function wireCards(root: HTMLElement, ctx: Ctx, study: Study, repaint: (s: Study) => void): void {
  for (const card of study.cards) {
    root.querySelector(`[data-edit-card="${card.id}"]`)?.addEventListener('click', () => {
      openEditCardModal({ editCard: ctx.deps.editCard, i18n: ctx.deps.i18n }, study, card, repaint);
    });
  }
}

function wireIssues(root: HTMLElement, ctx: Ctx, study: Study, repaint: (s: Study) => void): void {
  for (const card of study.cards) {
    for (const issue of card.issues ?? []) {
      root.querySelector(`[data-issue-ai="${issue.id}"]`)?.addEventListener('click', () => {
        openResolveIssueModal(
          {
            studies: ctx.deps.studies,
            resolveIssueWithAI: ctx.deps.resolveIssueWithAI,
            applyIssueResolution: ctx.deps.applyIssueResolution,
            deleteCard: ctx.deps.deleteCard,
            i18n: ctx.deps.i18n,
          },
          study,
          card,
          issue,
          repaint,
        );
      });
      root
        .querySelector(`[data-issue-resolve="${issue.id}"]`)
        ?.addEventListener('click', async () => {
          const next = await ctx.deps.updateIssueStatus.execute(
            study.id,
            card.id,
            issue.id,
            'resolve',
          );
          repaint(next);
        });
      root
        .querySelector(`[data-issue-dismiss="${issue.id}"]`)
        ?.addEventListener('click', async () => {
          const next = await ctx.deps.updateIssueStatus.execute(
            study.id,
            card.id,
            issue.id,
            'dismiss',
          );
          repaint(next);
        });
    }
  }
}

function exportStudy(ctx: Ctx, study: Study): Promise<void> {
  return ctx.deps.exportStudy.execute(study.id).then((envelope) => {
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = study.name.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
    a.href = url;
    a.download = `kartaak-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

function openRenameModal(ctx: Ctx, study: Study, onRenamed: (study: Study) => void): void {
  const { i18n } = ctx.deps;
  const modal = openModal(
    {
      title: i18n.t('studyDetail.rename.modalTitle'),
      primaryLabel: i18n.t('studyDetail.rename.save'),
      secondaryLabel: i18n.t('app.cancel'),
      bodyHtml: `
        <input data-rename-input type="text" value="${escapeHtml(study.name)}"
               class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary focus:outline-none text-sm" />
      `,
    },
    async () => {
      const value = modal.root.querySelector<HTMLInputElement>('[data-rename-input]')?.value ?? '';
      modal.setBusy(true, i18n.t('app.saving'));
      try {
        const next = await ctx.deps.renameStudy.execute(study.id, value);
        modal.close();
        onRenamed(next);
      } catch (err) {
        modal.setBusy(false);
        throw err;
      }
    },
  );
}

async function openDedupeModal(
  ctx: Ctx,
  study: Study,
  onDone: (study: Study) => void,
): Promise<void> {
  const { i18n } = ctx.deps;
  const preview = await ctx.deps.dedupeStudyCards.preview(study.id);

  if (preview.duplicatesToRemove === 0) {
    openModal(
      {
        title: i18n.t('studyDetail.actions.dedupe'),
        primaryLabel: i18n.t('app.cancel'),
        bodyHtml: `<p class="text-sm text-slate-600">${i18n.t('studyDetail.dedupe.empty')}</p>`,
      },
      async () => {
        // primary just closes
      },
    );
    return;
  }

  const modal = openModal(
    {
      title: i18n.t('studyDetail.dedupe.modalTitle'),
      primaryLabel: i18n.t('studyDetail.dedupe.confirm'),
      secondaryLabel: i18n.t('app.cancel'),
      destructive: true,
      bodyHtml: `
        <p class="text-sm text-slate-600">
          ${i18n.t('studyDetail.dedupe.summary', {
            duplicates: preview.duplicatesToRemove,
            groups: preview.uniqueGroups,
          })}
        </p>
      `,
    },
    async () => {
      modal.setBusy(true, i18n.t('studyDetail.dedupe.busy'));
      const result = await ctx.deps.dedupeStudyCards.execute(study.id);
      modal.close();
      alert(
        i18n.t('studyDetail.dedupe.done', {
          removed: result.removed,
          kept: result.study.cards.length,
        }),
      );
      onDone(result.study);
    },
  );
}

function confirmDelete(ctx: Ctx, study: Study): void {
  const { i18n } = ctx.deps;
  const modal = openModal(
    {
      title: i18n.t('studyDetail.delete.title'),
      primaryLabel: i18n.t('studyDetail.delete.confirm'),
      secondaryLabel: i18n.t('studyDetail.delete.cancel'),
      destructive: true,
      bodyHtml: `
        <p class="text-sm text-slate-600">
          ${i18n.t('studyDetail.delete.warning', { name: study.name, count: study.cards.length })}
        </p>
      `,
    },
    async () => {
      modal.setBusy(true, i18n.t('studyDetail.delete.busy'));
      await ctx.deps.deleteStudy.execute(study.id);
      modal.close();
      ctx.router.navigate({ type: 'home' });
    },
  );
}
