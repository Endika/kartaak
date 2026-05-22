# Changelog

## [0.0.19](https://github.com/Endika/kartaak/compare/v0.0.18...v0.0.19) (2026-05-22)


### Bug Fixes

* **ci:** grant actions: write to enable workflow_dispatch self-rearm ([fde0b8e](https://github.com/Endika/kartaak/commit/fde0b8e898fbbce04690906b3d0aa005e9bc4158))

## [0.0.18](https://github.com/Endika/kartaak/compare/v0.0.17...v0.0.18) (2026-05-22)


### Features

* **ci:** deploy to Pages on release, not on every push ([fffe0b7](https://github.com/Endika/kartaak/commit/fffe0b745445d3b5281e4c8e8a5c4b99b565c257))

## [0.0.17](https://github.com/Endika/kartaak/compare/v0.0.16...v0.0.17) (2026-05-22)


### Bug Fixes

* **ci:** re-trigger release-please via workflow_dispatch after auto-merge ([f1d110a](https://github.com/Endika/kartaak/commit/f1d110afa4cbad49d9108579b27a3ce74e1f1400))

## [0.0.16](https://github.com/Endika/kartaak/compare/v0.0.15...v0.0.16) (2026-05-22)


### Bug Fixes

* **ci:** delete PR branch on close regardless of merge state ([c730a1a](https://github.com/Endika/kartaak/commit/c730a1abc731c1079c3fbac137a7b38f5da88391))

## [0.0.15](https://github.com/Endika/kartaak/compare/v0.0.14...v0.0.15) (2026-05-22)


### Bug Fixes

* **release:** pass -R repo to gh pr merge ([0b9a82e](https://github.com/Endika/kartaak/commit/0b9a82e574479e2f1936a9c58006d24c00735305))


### Documentation

* **readme:** align structure with mintza and converthub ([1115c42](https://github.com/Endika/kartaak/commit/1115c422d1d67938279dfdb57b4413c68fa4cc2b))

## [0.0.14](https://github.com/Endika/kartaak/compare/v0.0.13...v0.0.14) (2026-05-21)


### Features

* **study:** scheduler that surfaces what's actually due ([2378efc](https://github.com/Endika/kartaak/commit/2378efc5aee1596d141027052ce84c13e6cdf243))

## [0.0.13](https://github.com/Endika/kartaak/compare/v0.0.12...v0.0.13) (2026-05-21)


### Features

* **ux:** promote Study as the primary action ([f2acc7e](https://github.com/Endika/kartaak/commit/f2acc7e50fda9bdab6f701a6bd3b2a0c2a4a6516))

## [0.0.12](https://github.com/Endika/kartaak/compare/v0.0.11...v0.0.12) (2026-05-21)


### Features

* **dedupe:** prevent and remove duplicate cards ([6a5723e](https://github.com/Endika/kartaak/commit/6a5723e4ae3f7e8ba26c9435f89afa81586ae649))

## [0.0.11](https://github.com/Endika/kartaak/compare/v0.0.10...v0.0.11) (2026-05-21)


### Features

* **study:** play a subtle tone after rating a card ([20f0d15](https://github.com/Endika/kartaak/commit/20f0d1518d7363913f3bcfd1a88f9181364bf1af))

## [0.0.10](https://github.com/Endika/kartaak/compare/v0.0.9...v0.0.10) (2026-05-21)


### Features

* **errors:** typed AI error hierarchy with translated messages ([b19492a](https://github.com/Endika/kartaak/commit/b19492a16cb307080ecbf09f58a80f8bf59638b5))


### Bug Fixes

* **stats:** preserve streak ending yesterday when today has no activity ([ee6cee6](https://github.com/Endika/kartaak/commit/ee6cee6b44379d7a1b024389520d581cb18f340d))

## [0.0.9](https://github.com/Endika/kartaak/compare/v0.0.8...v0.0.9) (2026-05-21)


### Features

* **i18n:** add English/Spanish/Basque support with language selector ([b9d6d7b](https://github.com/Endika/kartaak/commit/b9d6d7b943c7ecbb924d1fcfa09c6f8f5cb6deca))

## [0.0.8](https://github.com/Endika/kartaak/compare/v0.0.7...v0.0.8) (2026-05-21)


### Documentation

* rewrite readme for a public, friendlier tone ([636e8cf](https://github.com/Endika/kartaak/commit/636e8cf593dcd3c0d8de48a8203a22db90d1391d))

## [0.0.7](https://github.com/Endika/kartaak/compare/v0.0.6...v0.0.7) (2026-05-21)


### Features

* **stats:** donut chart, 30-day trend bars and extended metrics ([1466df2](https://github.com/Endika/kartaak/commit/1466df2a9ee920217558b4cfca6f5c2ec0dc1634))

## [0.0.6](https://github.com/Endika/kartaak/compare/v0.0.5...v0.0.6) (2026-05-21)


### Features

* **ai:** add openai and anthropic providers + anchor preview prompt ([1e39fa1](https://github.com/Endika/kartaak/commit/1e39fa185c2aa28a35f53ed9ef1b41d6d186c469))
* **stats:** daily history, streak counter and activity heatmap ([83beb9f](https://github.com/Endika/kartaak/commit/83beb9fcd050bd67f4c7ffd9d9212785e07cb71c))
* **study:** add-more-cards flow with workflow edit and preview ([27f7781](https://github.com/Endika/kartaak/commit/27f7781c9431956fe0781fada884277c71594f60))
* **study:** card issues, edit and delete plus study export/import ([7b6587c](https://github.com/Endika/kartaak/commit/7b6587c756a98bc10ecddea6a4edf969e79236a6))
* **study:** rename, search and sort in the multi-study list ([f3ae969](https://github.com/Endika/kartaak/commit/f3ae9696cc82d22797a73c19ceae4db1838e0a7f))
* **study:** resolve issues with ai ([a710228](https://github.com/Endika/kartaak/commit/a710228d8c2c23820f23824af0115e9217f2f55c))
* **ui:** study detail page, edit/issue modals and multi-model picker ([36a38b7](https://github.com/Endika/kartaak/commit/36a38b789c9a3fa85eb44ffbd8131a32ac805e0b))


### Bug Fixes

* **pwa:** poll for sw updates and surface the reload banner properly ([e9fdb97](https://github.com/Endika/kartaak/commit/e9fdb97ef4334882a97b0aa1403f84b225c223f4))

## [0.0.5](https://github.com/Endika/kartaak/compare/v0.0.4...v0.0.5) (2026-05-21)


### Bug Fixes

* **ai:** switch gemini model from 1.5-flash to 2.5-flash ([56b828f](https://github.com/Endika/kartaak/commit/56b828fe31b0d8d9a44794726b12d9f6d0024fe5))

## [0.0.4](https://github.com/Endika/kartaak/compare/v0.0.3...v0.0.4) (2026-05-21)


### Documentation

* add MIT license ([f9ab500](https://github.com/Endika/kartaak/commit/f9ab500f3221a3b465507f7cba6881862545fa98))

## [0.0.3](https://github.com/Endika/kartaak/compare/v0.0.2...v0.0.3) (2026-05-21)


### Documentation

* add status badges to readme header ([d9dac88](https://github.com/Endika/kartaak/commit/d9dac887b8ab2da50099a248f299c116e0086570))

## [0.0.2](https://github.com/Endika/kartaak/compare/v0.0.1...v0.0.2) (2026-05-21)


### Features

* **application:** add preview, full-study and review use cases ([213e9ef](https://github.com/Endika/kartaak/commit/213e9efa9b236897c1deeabb8a40583d042d6c4e))
* **brand:** add layered-cards favicon and refresh readme ([302ee82](https://github.com/Endika/kartaak/commit/302ee822cbc8c2128c1058a9c74b1111a82911ad))
* **domain:** add study aggregate, workflow value object and card dedupe ([6b89811](https://github.com/Endika/kartaak/commit/6b8981124ac453e10185ce9c11a2a43b957c479f))
* **infrastructure:** add gemini client, study repos and api key storage ([9f4bbcc](https://github.com/Endika/kartaak/commit/9f4bbccf81b6b32c5f9f0caa2cccebd2b6c6fece))
* **presentation:** wire workflow, preview and study flow with 3d flip ([5ba319d](https://github.com/Endika/kartaak/commit/5ba319dca56cec69a75d424cca4db7e50dee5f6b))
* **pwa:** make installable with auto-update and version footer ([7b8c7a0](https://github.com/Endika/kartaak/commit/7b8c7a04690d5e1c71783b5c9ec916c8b6e6a382))
