import { Container } from './Container';
import { AppRouter } from '@presentation/AppRouter';

export function mountApp(root: HTMLElement): void {
  const container = new Container();
  const router = new AppRouter(root, container);
  router.start();
}
