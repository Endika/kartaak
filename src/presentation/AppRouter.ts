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

export interface PageContext<TDeps> {
  router: AppRouter;
  deps: TDeps;
}

export class AppRouter {
  private view: View = { type: 'home' };

  constructor(
    private readonly root: HTMLElement,
    private readonly container: Container,
  ) {
    container.i18n.onChange(() => this.render());
  }

  start(): void {
    this.render();
  }

  navigate(next: View): void {
    this.view = next;
    this.render();
  }

  private render(): void {
    this.root.innerHTML = '';
    const c = this.container;
    switch (this.view.type) {
      case 'home':
        void renderHomePage(this.root, {
          router: this,
          deps: {
            studies: c.studies,
            apiKeys: c.apiKeys,
            importStudy: c.importStudy,
            i18n: c.i18n,
          },
        });
        return;
      case 'settings':
        renderSettingsPage(this.root, {
          router: this,
          deps: { apiKeys: c.apiKeys, i18n: c.i18n, sounds: c.sounds },
        });
        return;
      case 'create-workflow':
        renderWorkflowPage(
          this.root,
          {
            router: this,
            deps: { apiKeys: c.apiKeys, generatePreview: c.generatePreview, i18n: c.i18n },
          },
          this.view.draft,
        );
        return;
      case 'preview':
        renderPreviewPage(
          this.root,
          {
            router: this,
            deps: {
              generatePreview: c.generatePreview,
              generateFullStudy: c.generateFullStudy,
              i18n: c.i18n,
            },
          },
          this.view.workflow,
          this.view.previewCards,
        );
        return;
      case 'study':
        renderStudyPage(
          this.root,
          {
            router: this,
            deps: {
              reviewCard: c.reviewCard,
              editCard: c.editCard,
              markCardIssue: c.markCardIssue,
              i18n: c.i18n,
              sounds: c.sounds,
            },
          },
          this.view.study,
        );
        return;
      case 'study-detail':
        void renderStudyDetailPage(
          this.root,
          {
            router: this,
            deps: {
              studies: c.studies,
              renameStudy: c.renameStudy,
              deleteStudy: c.deleteStudy,
              exportStudy: c.exportStudy,
              updateIssueStatus: c.updateIssueStatus,
              editCard: c.editCard,
              resolveIssueWithAI: c.resolveIssueWithAI,
              applyIssueResolution: c.applyIssueResolution,
              deleteCard: c.deleteCard,
              dedupeStudyCards: c.dedupeStudyCards,
              i18n: c.i18n,
            },
          },
          this.view.studyId,
        );
        return;
      case 'add-more-cards':
        void renderAddMoreCardsPage(
          this.root,
          {
            router: this,
            deps: {
              studies: c.studies,
              apiKeys: c.apiKeys,
              generatePreview: c.generatePreview,
              addMoreCards: c.addMoreCards,
              i18n: c.i18n,
            },
          },
          this.view.studyId,
        );
        return;
    }
  }
}
