# Distran

**One ledger. Every format.** A Tauri 2 app for discovering, logging and connecting the works you love.

The Kotlin/Compose prototype has been replaced with a responsive React + TypeScript interface inside Tauri. The first runnable target is macOS; the interface also adapts to phone widths. Native Android/iOS packaging is a later step and is not claimed as completed.

## Open the app

Requirements: Node 22.12+, pnpm 11, Rust 1.90+, and Xcode command-line tools on macOS.

```sh
pnpm install
pnpm app
```

This opens the native Tauri window. No emulator, Android Studio configuration or Gradle installation is needed for the macOS preview. The development launcher reuses a running Distran frontend on port 1420.

For the browser preview: `pnpm dev`, then open <http://127.0.0.1:1420>.

## Persistent local test accounts

| Role | Email | Password |
|---|---|---|
| User | `user@distran.test` | `DistranDemo2026!` |
| Creator | `creator@distran.test` | `DistranDemo2026!` |

Use **Try as a user** or **Try as a creator** for quick entry. Complete setup or choose **Skip for now**. Account profiles, logs, lists, Top 4 order, settings, followed creators and chat drafts persist on the current device and app origin. Sign out keeps the data. Browser and native app storage are separate. These are local preview accounts, not hosted WorkOS accounts.

## What works now

- Sign in, local sign up, user/creator setup and session restoration.
- Home, Discover, search/filter/sort, format switching, title rooms and related works.
- Logging with half-star ratings, notes, dates, privacy preferences and editing/deletion.
- Mixed-media lists with item selection, manual ordering, editing and deletion.
- Custom profile pictures/banners, unique usernames, display names and ordered Top 4 per format.
- Searchable creator rooms, customizable headlines/themes/selected works, membership sparkle/glow, follows and pending credit-claim requests.
- Rotating editorial Home spotlight and larger poster-centered mobile title pages.
- Local conversation drafts, profile editing, data export/copy and local account deletion.

Discover now searches live TMDB movies/TV and IGDB games through the local backend. Start it with `pnpm api` after installing the [backend environment](backend/README.md). Home and mood shelves retain the 12-work curated collection as a labelled fallback. Creator search now also reads TMDB people and IGDB companies; [creator documentation](docs/CREATOR_PROFILES.md) explains customization and local pending claims. Its ratings are illustrative; live provider scores are labelled separately. Hosted authentication, network messaging, sharing and model-powered recommendations remain integration work. Buddy and provider connections are disabled; music, books and the broader social feed remain a later milestone.

## Structure

```text
apps/desktop/           React client and Tauri native shell
  src/components/      Shared UI, shell and editors
  src/pages/           Screen-level flows
  src/lib/             Catalog, account/ledger rules and persistence
  src/styles/          Design tokens, page styles and responsive layout
  src-tauri/           Rust shell, capability policy and app configuration
  e2e/                 Browser workflow and responsive checks
backend/               FastAPI starter and PostgreSQL schema draft
ml/                    Model code, Colab notebooks and mathematical documentation
docs/                  Product plan, architecture, design sources and validation
```

## Check and build

```sh
pnpm build             # TypeScript + bundled local preview frontend
pnpm test              # Account, persistence and data-rule tests
pnpm test:api          # Mocked provider, cache and API tests
pnpm check:catalog     # Optional live gateway smoke/timing check (API must be running)
pnpm test:e2e          # Browser workflows; install headless Chromium first if needed
pnpm app:build         # Native macOS app bundle
```

Test browser setup: `pnpm --dir apps/desktop exec playwright install chromium --only-shell`.
The default build deliberately uses `--mode demo` and includes the local preview login. `pnpm --dir apps/desktop build:production` disables those logins; production hosted authentication must be implemented before that mode is useful. Neither preview build is a deployed service.

## Documentation

- [Preview and launch instructions](docs/PREVIEW.md)
- [Development plan and current scope](docs/PLAN.md)
- [Catalog API configuration and performance](docs/CATALOG_API.md)
- [Architecture and integration boundaries](docs/ARCHITECTURE.md)
- [Figma mapping and design decisions](docs/design/IMPLEMENTATION.md)
- [Provider and dataset research](docs/research/SOURCES.md)
- [Training mathematics and Colab notebooks](ml/README.md)
- [Verification record](docs/VALIDATION.md)

The original dataset proposal remains at the repository root. Presentation text, Figma node specifications and reference exports are retained in `docs/design/`.

## AI training and recommendations

The home feed includes on-device content recommendations from a Colab-trained TF-IDF/SVD index, using local favourites and ratings with format filtering. See [the training process and results](ml/notebooks/TRAINING_RESULTS.md) alongside [the runnable notebook](ml/notebooks/03_training.ipynb). Amazon BPR/popularity/hybrid results are separate research benchmarks; Buddy chat stays disabled. No extra inference hosting is required for the current content model.

The [Kaggle follow-up](ml/notebooks/KAGGLE_TRAINING_RESULTS.md) adds evaluated movie/game aggregate-score models and a shared content model trained on 32,952 metadata documents. The app bundles its projected vectors; external titles and aggregate predictions are not automatically imported into the catalog.

## Buddy thematic lists and conversation

Buddy & friends now provides a local preview for thematic recommendations, refinements, evidence and private list saving, plus grounded follow-up conversation and live TMDB/IGDB discovery by themes, genres, inspiration titles and directors/studios. Model selection is explicit: Perplexity Decider for thematic scores and NVIDIA Nemotron for conversation, through OpenRouter using only the approved free IDs. Home ranking stays local. See [setup and routing documentation](docs/BUDDY_RECOMMENDATIONS.md).

## Provider-backed catalog and clear recommendation sources

Built-in media now uses reviewed TMDB/IGDB IDs, canonical SQLite records and safe migration of old saved IDs. Work cards prioritise studios for games and directors for movies/TV, with creator-page icons and linked credits. Ordinary recommendations stay visually neutral; Buddy results and saved Buddy lists have a labeled lavender glow. See [implementation and refresh instructions](docs/CATALOG_RECONCILIATION.md).
