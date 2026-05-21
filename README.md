# Kartaak

> Learn at your own pace.

Flashcard study app with AI-generated cards. Offline-first PWA — you study locally, the AI only runs when you ask it to generate or refine cards.

## Status

Early development. Building the thin slice: create study → preview → generate → study with flip.

## Stack

- TypeScript (strict)
- Vite
- Tailwind CSS
- Vitest
- IndexedDB + localStorage
- Vanilla DOM (no framework)

## Commands

```bash
npm install
npm run dev        # dev server
npm run build      # production build
npm run typecheck
npm test
```

## Architecture

Domain-Driven Design with four layers:

```
src/
├── domain/          pure business logic, no external deps
├── application/     use cases that orchestrate domain + infrastructure
├── infrastructure/  AI clients, persistence, browser APIs
└── presentation/    DOM rendering, styles, user interaction
```

Path aliases (`@domain/*`, `@application/*`, etc.) are configured in `tsconfig.json` and `vite.config.ts`.

## AI providers

The thin slice integrates Google Gemini. OpenAI and Anthropic are planned. API keys live in `localStorage` and never leave the browser.
