import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return;

  registerSW({
    immediate: true,
    onNeedRefresh() {
      showUpdateBanner();
    },
    onOfflineReady() {
      // First install completed. Nothing to do — study works offline by design.
    },
  });
}

function showUpdateBanner(): void {
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
  banner.querySelector('#update-banner-reload')?.addEventListener('click', () => {
    window.location.reload();
  });
}
