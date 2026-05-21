import type { Container } from '@bootstrap/Container';
import type { Card } from '@domain/study/entities/Card';
import type { Study } from '@domain/study/entities/Study';
import type { StudyWorkflow } from '@domain/study/value-objects/StudyWorkflow';
import { renderAddMoreCardsPage } from './pages/AddMoreCardsPage';
import { renderHomePage } from './pages/HomePage';
import { renderPreviewPage } from './pages/PreviewPage';
import { renderSettingsPage } from './pages/SettingsPage';
import { renderStudyDetailPage } from './pages/StudyDetailPage';
import { renderStudyPage } from './pages/StudyPage';
import { renderWorkflowPage } from './pages/WorkflowPage';

export type View =
  | { type: 'home' }
  | { type: 'settings' }
  | { type: 'create-workflow'; draft?: WorkflowDraft }
  | { type: 'preview'; workflow: StudyWorkflow; previewCards: Card[] }
  | { type: 'study'; study: Study }
  | { type: 'study-detail'; studyId: string }
  | { type: 'add-more-cards'; studyId: string };

export interface WorkflowDraft {
  theme: string;
  topicsRaw: string;
  instructions: string;
  quantity: number;
  includeImages: boolean;
  aiModel: import('@domain/study/value-objects/StudyWorkflow').AIModelId;
}

export class AppRouter {
  private view: View = { type: 'home' };

  constructor(
    private readonly root: HTMLElement,
    private readonly container: Container,
  ) {}

  start(): void {
    this.render();
  }

  navigate(next: View): void {
    this.view = next;
    this.render();
  }

  private render(): void {
    this.root.innerHTML = '';
    const ctx = { router: this, container: this.container };
    switch (this.view.type) {
      case 'home':
        renderHomePage(this.root, ctx);
        return;
      case 'settings':
        renderSettingsPage(this.root, ctx);
        return;
      case 'create-workflow':
        renderWorkflowPage(this.root, ctx, this.view.draft);
        return;
      case 'preview':
        renderPreviewPage(this.root, ctx, this.view.workflow, this.view.previewCards);
        return;
      case 'study':
        renderStudyPage(this.root, ctx, this.view.study);
        return;
      case 'study-detail':
        void renderStudyDetailPage(this.root, ctx, this.view.studyId);
        return;
      case 'add-more-cards':
        void renderAddMoreCardsPage(this.root, ctx, this.view.studyId);
        return;
    }
  }
}

export interface PageContext {
  router: AppRouter;
  container: Container;
}
