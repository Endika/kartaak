import { registerSW } from 'virtual:pwa-register';

const UPDATE_POLL_MS = 60 * 60 * 1000;

export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return;

  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch(() => {});
      }, UPDATE_POLL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });
    },
    onNeedRefresh() {
      showUpdateBanner(() => {
        void updateSW(true);
      });
    },
  });
}

function showUpdateBanner(applyUpdate: () => void): void {
  if (document.getElementById('update-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.className =
    'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white text-sm shadow-lg flex items-center gap-3';
  banner.innerHTML = `
    <span>A new version is available.</span>
    <button id="update-banner-reload" class="font-medium underline hover:no-underline">Reload</button>
  `;
  document.body.appendChild(banner);
  banner.querySelector('#update-banner-reload')?.addEventListener('click', applyUpdate);
}
