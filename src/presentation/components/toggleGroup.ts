export function wireToggleGroup(
  root: HTMLElement,
  buttonSelector: string,
  hiddenSelector: string,
  dataAttr: string,
  classFor: (selected: boolean) => string,
): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>(buttonSelector);
  const hidden = root.querySelector<HTMLInputElement>(hiddenSelector);
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset[dataAttr] ?? '';
      if (hidden) hidden.value = value;
      buttons.forEach((b) => {
        b.className = classFor(b.dataset[dataAttr] === value);
      });
    });
  });
}
