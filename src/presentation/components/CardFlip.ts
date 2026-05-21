import { escapeHtml } from './Layout';

export function flipCardHtml(front: string, back: string, opts?: { id?: string }): string {
  const id = opts?.id ?? 'flip-card';
  return `
    <div id="${id}" class="flip-card mx-auto" tabindex="0" role="button" aria-label="Flashcard, tap to reveal answer">
      <div class="flip-card-inner">
        <div class="flip-card-face flip-card-front">
          <div>${escapeHtml(front)}</div>
          <span class="flip-card-hint">tap to flip</span>
        </div>
        <div class="flip-card-face flip-card-back">
          <div>${escapeHtml(back)}</div>
          <span class="flip-card-hint">tap to flip back</span>
        </div>
      </div>
    </div>
  `;
}

export function attachFlipBehavior(
  cardEl: HTMLElement,
  onFlip?: (flipped: boolean) => void
): () => void {
  let flipped = false;
  const toggle = () => {
    flipped = !flipped;
    cardEl.classList.toggle('is-flipped', flipped);
    onFlip?.(flipped);
  };

  const clickHandler = () => toggle();
  cardEl.addEventListener('click', clickHandler);

  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  };
  cardEl.addEventListener('keydown', keyHandler);

  let touchStartX = 0;
  let touchStartY = 0;
  const touchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  };
  const touchEnd = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartX;
    const dy = Math.abs(t.clientY - touchStartY);
    if (Math.abs(dx) > 40 && dy < 60) {
      // horizontal swipe; let click also fire — guard against double toggle
      e.preventDefault();
      toggle();
    }
  };
  cardEl.addEventListener('touchstart', touchStart, { passive: true });
  cardEl.addEventListener('touchend', touchEnd);

  return () => {
    cardEl.removeEventListener('click', clickHandler);
    cardEl.removeEventListener('keydown', keyHandler);
    cardEl.removeEventListener('touchstart', touchStart);
    cardEl.removeEventListener('touchend', touchEnd);
  };
}

export function resetFlip(cardEl: HTMLElement): void {
  cardEl.classList.remove('is-flipped');
}
