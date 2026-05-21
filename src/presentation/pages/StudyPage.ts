import type { PageContext } from '../AppRouter';
import { appShell, escapeHtml } from '../components/Layout';
import { flipCardHtml, attachFlipBehavior } from '../components/CardFlip';
import type { Study } from '@domain/study/entities/Study';
import type { Card, ReviewResult } from '@domain/study/entities/Card';

export function renderStudyPage(root: HTMLElement, ctx: PageContext, study: Study): void {
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

    root.innerHTML = appShell(`
      <div class="mb-5 flex items-center justify-between text-sm text-slate-500">
        <span>${escapeHtml(currentStudy.name)}</span>
        <span>${index + 1} / ${total} · ${learned} learned</span>
      </div>

      <div class="flex justify-center mb-8">
        ${flipCardHtml(card.front, card.back, { id: 'study-flip' })}
      </div>

      <div id="answer-actions" class="grid grid-cols-3 gap-2 max-w-md mx-auto opacity-40 pointer-events-none transition">
        <button data-result="incorrect" class="px-3 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90 transition">Incorrect</button>
        <button data-result="partial" class="px-3 py-2 rounded-lg bg-warning text-white text-sm font-medium hover:opacity-90 transition">Partial</button>
        <button data-result="correct" class="px-3 py-2 rounded-lg bg-success text-white text-sm font-medium hover:opacity-90 transition">Correct</button>
      </div>
      <p id="hint" class="text-center text-xs text-slate-400 mt-3">Tap or press space to flip — then rate your answer.</p>
    `, { back: { label: 'Home', onBackId: 'back-home' } });

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
        if (hint) hint.textContent = 'Rate how well you knew it.';
      } else {
        actions.classList.add('opacity-40', 'pointer-events-none');
        if (hint) hint.textContent = 'Tap or press space to flip — then rate your answer.';
      }
    });

    actions.querySelectorAll<HTMLButtonElement>('[data-result]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!flipped) return;
        const result = btn.dataset.result as ReviewResult;
        actions.querySelectorAll('button').forEach((b) => (b.disabled = true));
        try {
          const updated = await ctx.container.reviewCard.execute(currentStudy.id, card.id, result);
          currentStudy = updated;
          index += 1;
          paint();
        } catch (err) {
          actions.querySelectorAll('button').forEach((b) => (b.disabled = false));
          if (hint) hint.textContent = err instanceof Error ? err.message : 'Could not save review.';
        }
      });
    });
  }

  function paintComplete(): void {
    const total = currentStudy.cards.length;
    const learned = currentStudy.cards.filter((c) => c.status === 'learned').length;
    root.innerHTML = appShell(`
      <div class="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 class="text-2xl font-bold mb-2">Session complete</h1>
        <p class="text-slate-500 mb-6">You went through all ${total} cards · ${learned} learned.</p>
        <div class="flex justify-center gap-2">
          <button id="restart" class="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition">Review again</button>
          <button id="back-home-end" class="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition">Back to studies</button>
        </div>
      </div>
    `, { back: { label: 'Home', onBackId: 'back-home' } });

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
