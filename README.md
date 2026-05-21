# Kartaak

> Learn at your own pace.

**[Live demo →](https://endika.github.io/kartaak/)**

[![Latest release](https://img.shields.io/github/v/release/Endika/kartaak?style=flat-square&color=0066FF&label=release)](https://github.com/Endika/kartaak/releases/latest)
[![Deploy](https://img.shields.io/github/actions/workflow/status/Endika/kartaak/deploy.yml?style=flat-square&label=deploy&branch=main)](https://github.com/Endika/kartaak/actions/workflows/deploy.yml)
[![CI](https://img.shields.io/github/actions/workflow/status/Endika/kartaak/ci.yml?style=flat-square&label=ci&branch=main)](https://github.com/Endika/kartaak/actions/workflows/ci.yml)
[![Last commit](https://img.shields.io/github/last-commit/Endika/kartaak?style=flat-square)](https://github.com/Endika/kartaak/commits/main)
[![Code style: Biome](https://img.shields.io/badge/code_style-biome-60A5FA?style=flat-square)](https://biomejs.dev)

Flashcard study app with AI-generated cards. Offline-first PWA — you study locally, the AI only runs when you ask it to generate or refine cards.

## What works today

- **Describe what you want to study** in free text: theme, optional subtopics, free-form instructions, quantity.
- **Preview before you pay**: the AI generates four sample cards first; you can regenerate or tweak the workflow before committing to the full batch.
- **Full-deck generation** with automatic deduplication, stored in IndexedDB.
- **Study with a 3D flip animation** — click, keyboard or horizontal swipe to reveal the back.
- **Spaced repetition** updates as you rate each card incorrect / partial / correct.

## Try it

1. Open the [live demo](https://endika.github.io/kartaak/).
2. Click **Settings**, paste a [Gemini API key](https://aistudio.google.com/app/apikey) (kept in your browser only — never sent to a server).
3. Hit **New study**, describe what you want to learn, generate a preview, then the full deck.

## Run locally

```bash
npm install
npm run dev        # dev server
npm run build      # production build
npm run typecheck
npm test
```

## Stack

- TypeScript (strict) + Vanilla DOM — no framework
- Vite
- Tailwind CSS
- Vitest + fake-indexeddb for integration tests
- IndexedDB (studies + cards) and `localStorage` (API keys)
- Service Worker for offline study (planned)

## Architecture

Domain-Driven Design across four layers:

```
src/
├── domain/          pure business logic, no external deps
├── application/     use cases that orchestrate domain + infrastructure
├── infrastructure/  AI clients, persistence, browser APIs
└── presentation/    DOM rendering, styles, user interaction
```

Path aliases (`@domain/*`, `@application/*`, etc.) are configured in `tsconfig.json` and `vite.config.ts`.

## AI providers

Gemini is wired today. OpenAI and Anthropic are planned and share the same `ICardGeneratorService` port, so adding them is dropping a new client and a model selector.

## Roadmap

- [ ] Edit cards inline + report issues + resolve issues with AI
- [ ] Add-more flow with workflow editing and preview (Feature 9 v1.5)
- [ ] Stats dashboard (heatmap, streak, learned %)
- [ ] Export / import JSON (with workflow preserved)
- [ ] PWA + service worker offline-first
- [ ] OpenAI and Anthropic providers
- [ ] Optional image-backed cards
