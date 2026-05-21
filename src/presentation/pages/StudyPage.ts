import type { EditCardUseCase } from '@application/use-cases/EditCardUseCase';
import type { MarkCardIssueUseCase } from '@application/use-cases/MarkCardIssueUseCase';
import type { ReviewCardUseCase } from '@application/use-cases/ReviewCardUseCase';
import type { Card, ReviewResult } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import type { I18n } from '@shared/i18n';
import type { PageContext } from '../AppRouter';
import { attachFlipBehavior, flipCardHtml } from '../components/CardFlip';
import { openEditCardModal } from '../components/EditCardModal';
import { appShell, escapeHtml } from '../components/Layout';
import { openMarkIssueModal } from '../components/MarkIssueModal';

export interface StudyPageDeps {
  reviewCard: ReviewCardUseCase;
  editCard: EditCardUseCase;
  markCardIssue: MarkCardIssueUseCase;
  i18n: I18n;
}

type Ctx = PageContext<StudyPageDeps>;

export function renderStudyPage(root: HTMLElement, ctx: Ctx, study: Study): void {
  const { i18n } = ctx.deps;
  let currentStudy = study;
  let index = 0;
  let flipped = false;

  function paint(): void {
    const card = currentStudy.cards[index];
    if (!card) {
      paintComplete();
      return;
    }
    paintCard(card);
  }

  function paintCard(card: Card): void {
    const learned = currentStudy.cards.filter((c) => c.status === 'learned').length;
    const total = currentStudy.cards.length;

    root.innerHTML = appShell(
      `
      <div class="mb-5 flex items-center justify-between text-sm text-slate-500">
        <span>${escapeHtml(currentStudy.name)}</span>
        <span>${i18n.t('study.progress', { current: index + 1, total, learned })}</span>
      </div>

      <div class="flex justify-center mb-8">
        ${flipCardHtml(card.front, card.back, i18n, { id: 'study-flip' })}
      </div>

      <div id="answer-actions" class="grid grid-cols-3 gap-2 max-w-md mx-auto opacity-40 pointer-events-none transition">
        <button data-result="incorrect" class="px-3 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90 transition">${i18n.t('study.incorrect')}</button>
        <button data-result="partial" class="px-3 py-2 rounded-lg bg-warning text-white text-sm font-medium hover:opacity-90 transition">${i18n.t('study.partial')}</button>
        <button data-result="correct" class="px-3 py-2 rounded-lg bg-success text-white text-sm font-medium hover:opacity-90 transition">${i18n.t('study.correct')}</button>
      </div>

      <div class="flex justify-center gap-3 mt-4 text-xs text-slate-500">
        <button id="edit-card-btn" class="hover:text-primary transition">${i18n.t('study.editCard')}</button>
        <span aria-hidden="true">·</span>
        <button id="issue-card-btn" class="hover:text-danger transition">${i18n.t('study.reportIssue')}</button>
      </div>
      <p id="hint" class="text-center text-xs text-slate-400 mt-3">${i18n.t('study.flipHint')}</p>
    `,
      { back: { label: i18n.t('study.back'), onBackId: 'back-home' } },
    );

    root.querySelector('#back-home')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'home' });
    });

    const flipEl = root.querySelector<HTMLElement>('#study-flip');
    const actions = root.querySelector<HTMLElement>('#answer-actions');
    const hint = root.querySelector<HTMLElement>('#hint');
    if (!flipEl || !actions) return;

    flipped = false;
    attachFlipBehavior(flipEl, (isFlipped) => {
      flipped = isFlipped;
      if (flipped) {
        actions.classList.remove('opacity-40', 'pointer-events-none');
        if (hint) hint.textContent = i18n.t('study.rateHint');
      } else {
        actions.classList.add('opacity-40', 'pointer-events-none');
        if (hint) hint.textContent = i18n.t('study.flipHint');
      }
    });

    root.querySelector('#edit-card-btn')?.addEventListener('click', () => {
      openEditCardModal({ editCard: ctx.deps.editCard, i18n }, currentStudy, card, (next) => {
        currentStudy = next;
        paint();
      });
    });

    root.querySelector('#issue-card-btn')?.addEventListener('click', () => {
      openMarkIssueModal(
        { markCardIssue: ctx.deps.markCardIssue, i18n },
        currentStudy,
        card,
        (next) => {
          currentStudy = next;
        },
      );
    });

    actions.querySelectorAll<HTMLButtonElement>('[data-result]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!flipped) return;
        const result = btn.dataset.result as ReviewResult;
        actions.querySelectorAll('button').forEach((b) => {
          b.disabled = true;
        });
        try {
          const updated = await ctx.deps.reviewCard.execute(currentStudy.id, card.id, result);
          currentStudy = updated;
          index += 1;
          paint();
        } catch (err) {
          actions.querySelectorAll('button').forEach((b) => {
            b.disabled = false;
          });
          if (hint)
            hint.textContent = err instanceof Error ? err.message : i18n.t('study.reviewFailed');
        }
      });
    });
  }

  function paintComplete(): void {
    const total = currentStudy.cards.length;
    const learned = currentStudy.cards.filter((c) => c.status === 'learned').length;
    root.innerHTML = appShell(
      `
      <div class="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 class="text-2xl font-bold mb-2">${i18n.t('study.complete.title')}</h1>
        <p class="text-slate-500 mb-6">${i18n.t('study.complete.summary', { total, learned })}</p>
        <div class="flex justify-center gap-2">
          <button id="restart" class="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition">${i18n.t('study.complete.restart')}</button>
          <button id="back-home-end" class="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition">${i18n.t('study.complete.backHome')}</button>
        </div>
      </div>
    `,
      { back: { label: i18n.t('study.back'), onBackId: 'back-home' } },
    );

    root.querySelector('#back-home')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'home' });
    });
    root.querySelector('#back-home-end')?.addEventListener('click', () => {
      ctx.router.navigate({ type: 'home' });
    });
    root.querySelector('#restart')?.addEventListener('click', () => {
      index = 0;
      paint();
    });
  }

  paint();
}
