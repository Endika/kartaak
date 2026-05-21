import { escapeHtml } from './Layout';

export interface ModalOptions {
  title: string;
  bodyHtml: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  destructive?: boolean;
}

export interface ModalHandle {
  root: HTMLElement;
  close: () => void;
  setError: (message: string) => void;
  setBusy: (busy: boolean, busyLabel?: string) => void;
}

export function openModal(opts: ModalOptions, onPrimary: () => void | Promise<void>): ModalHandle {
  const overlay = document.createElement('div');
  overlay.className =
    'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 py-6';

  const dialog = document.createElement('div');
  dialog.className =
    'relative w-full max-w-md rounded-2xl bg-white shadow-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto';

  const primaryLabel = opts.primaryLabel ?? 'Save';
  const secondaryLabel = opts.secondaryLabel ?? 'Cancel';
  const primaryClass = opts.destructive
    ? 'bg-danger text-white hover:opacity-90'
    : 'bg-primary text-white hover:opacity-90';

  dialog.innerHTML = `
    <h2 class="text-lg font-semibold mb-3">${escapeHtml(opts.title)}</h2>
    <div data-modal-body>${opts.bodyHtml}</div>
    <p data-modal-error class="hidden mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"></p>
    <div class="mt-5 flex justify-end gap-2">
      <button data-modal-cancel class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">${escapeHtml(secondaryLabel)}</button>
      <button data-modal-primary class="px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 ${primaryClass}">${escapeHtml(primaryLabel)}</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', escListener);
  };

  const escListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', escListener);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const primaryBtn = dialog.querySelector<HTMLButtonElement>('[data-modal-primary]');
  const cancelBtn = dialog.querySelector<HTMLButtonElement>('[data-modal-cancel]');
  const errorEl = dialog.querySelector<HTMLElement>('[data-modal-error]');

  cancelBtn?.addEventListener('click', close);

  primaryBtn?.addEventListener('click', async () => {
    if (errorEl) {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    }
    try {
      await onPrimary();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err instanceof Error ? err.message : 'Something went wrong';
        errorEl.classList.remove('hidden');
      }
    }
  });

  return {
    root: dialog,
    close,
    setError(message: string) {
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
      }
    },
    setBusy(busy: boolean, busyLabel?: string) {
      if (!primaryBtn) return;
      primaryBtn.disabled = busy;
      if (busy && busyLabel) primaryBtn.textContent = busyLabel;
      if (!busy) primaryBtn.textContent = primaryLabel;
    },
  };
}
