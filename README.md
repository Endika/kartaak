# Kartaak

> Learn at your own pace.

**[Try it now →](https://endika.github.io/kartaak/)**

[![Latest release](https://img.shields.io/github/v/release/Endika/kartaak?style=flat-square&color=0066FF&label=release)](https://github.com/Endika/kartaak/releases/latest)
[![CI](https://img.shields.io/github/actions/workflow/status/Endika/kartaak/ci.yml?style=flat-square&label=ci&branch=main)](https://github.com/Endika/kartaak/actions/workflows/ci.yml)
[![Last commit](https://img.shields.io/github/last-commit/Endika/kartaak?style=flat-square)](https://github.com/Endika/kartaak/commits/main)
[![Conventional Commits](https://img.shields.io/badge/conventional_commits-1.0.0-FE5196?style=flat-square)](https://www.conventionalcommits.org)
[![License: MIT](https://img.shields.io/github/license/Endika/kartaak?style=flat-square&color=10B981)](./LICENSE)

Kartaak turns whatever you want to learn — a language, the periodic table, the plot of every Tarantino film — into a deck of flashcards in seconds. You describe it in your own words, an AI drafts the cards, and you study them with a satisfying 3D flip. Everything lives in your browser, including on your phone.

## What you can do

- **Type a topic, get a deck.** "Multiplication tables 7 and 8", "Spanish phrases for travelling", "Renaissance painters" — write it however you like. Kartaak does the rest.
- **Preview before you commit.** Four sample cards arrive first so you can fine-tune the style without paying for a full batch.
- **Study with a 3D flip.** Tap, swipe or press space to reveal the answer. Rate yourself **Incorrect**, **Partial** or **Correct** and the next-review date adapts on its own.
- **Edit, report and fix.** Spotted a typo or a wrong answer? Edit it on the spot, or report the issue and let the AI propose a fix you can accept with one tap.
- **Add more cards your way.** When you've outgrown the first batch, tweak the workflow (style, difficulty, even the model) and generate more — duplicates filtered automatically.
- **Track your progress.** Streak counter, status donut, 30-day activity heatmap, daily bar chart and a clean "best day" number — without ever touching a third-party tracker.
- **Take it offline.** Installable PWA. Pin it to your phone's home screen and study on the train.
- **Back up or share your decks.** Export any study as a JSON file, import it back later, or send it to a friend.

## How to start

1. Open the [live demo](https://endika.github.io/kartaak/).
2. Open **Settings** and paste a free [Gemini API key](https://aistudio.google.com/app/apikey). Claude and OpenAI work too. Your key never leaves your browser.
3. Tap **+ New study**, describe what you want to learn, review the preview, then generate.
4. Study a few cards a day. Come back tomorrow. Watch the heatmap fill up.

## Install on your device

Open the demo in Chrome, Edge or Safari and use **"Add to Home Screen"** (mobile) or **"Install"** (desktop). You get a full-screen icon, offline study, and automatic updates when a new version ships.

## Privacy

There is no Kartaak server. Your studies, cards, progress and API keys all live in your own browser. The only network traffic is straight to the AI provider you choose, only when you ask Kartaak to generate or fix a card. Delete any study from the detail page; delete the whole site from your browser to wipe everything.

## AI providers

| Provider | Default model | Direct from the browser? |
| --- | --- | --- |
| Google Gemini | `gemini-2.5-flash` | Yes — cheapest, recommended |
| Anthropic Claude | `claude-haiku-4-5` | Yes — uses a documented header |
| OpenAI | `gpt-4o-mini` | Usually no — CORS-blocked, needs a proxy |

Pick a different provider per study, or swap mid-way when you "Add more cards".

---

## For developers

Open-source, MIT licensed. PRs welcome.

**Stack** — TypeScript (strict), vanilla DOM with no framework runtime, Vite, Tailwind CSS, Vitest, Workbox-powered service worker, Biome for lint and format, release-please for automatic versioning from Conventional Commits.

**Architecture** — Domain-Driven Design across four layers:

```
src/
├── domain/          pure business logic, no external deps
├── application/     use cases that orchestrate domain + infrastructure
├── infrastructure/  AI clients, persistence, browser APIs
└── presentation/    DOM rendering, styles, user interaction
```

**Local dev**

```bash
npm install
npm run dev        # dev server
npm run build      # production build
npm run lint
npm run typecheck
npm test
```

CI runs lint, typecheck, tests and the production build on every PR.
