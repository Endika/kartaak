import { AppRouter } from '@presentation/AppRouter';
import { Container } from './Container';
import { registerServiceWorker } from './registerServiceWorker';

export function mountApp(root: HTMLElement): void {
  const container = new Container();
  const router = new AppRouter(root, container);
  router.start();
  registerServiceWorker();
}
