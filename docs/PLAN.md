# Development plan after the Tauri migration

## Current scope

The first media scope stays **games, films and television**. The Kotlin/Compose prototype is removed; a Tauri 2 native macOS preview now hosts the shared React/TypeScript UI. Mobile layouts are implemented, while native Android/iOS packaging is not yet part of the verified deliverable. Music, books and the broader social feed remain the next milestone.

The presentation's ordered **Top 4 per medium** is the implemented favourite model. The original dataset proposal's Top 5 was an earlier assumption.

| Slice | Implemented in this preview | Remaining integration |
|---|---|---|
| Identity | User/creator fixture login, local signup, three-step profile/interests/favourites setup, persistent session, logout | Hosted WorkOS identity, verification/recovery, secure token storage and callback handling |
| Catalog | Live TMDB/IGDB search/details, 12 curated works, posters, makers/companies, credits, collections, pagination, cache and failure states | Canonical identity matching, semantic retrieval and verified creator linking and production cache deployment |
| Ledger | Half-star ratings, notes, dates, statuses, privacy preferences, repeat logs, edit/delete | Authorized server persistence, offline sync and idempotent writes |
| Collections | Cross-media lists, visibility preferences, ordering, edit/delete | Actual sharing, collaboration and visibility enforcement |
| Profile / creators | Photos/banners, unique usernames, creator rooms/themes/selected works, live creator search, follows, local pending claims and ordered Top 4 | Hosted uploads/sync, moderated verified ownership and live activity |
| Messaging | Preview contacts and persistent local drafts | Real identity lookup, participant permissions, delivery/reconnect/unread, block/report |
| Settings | Profile editing, saved preferences, disabled connections, JSON export/copy, local account deletion | Hosted export/delete, notification delivery and account management |
| Buddy | Thematic catalog retrieval/reranking, refinements, local private list saving and single-turn conversation through two approved OpenRouter free models | Larger index, verified durations, thematic quality evaluation and hosted identity/rate controls |
| Training | Executed Colab Amazon 5-core BPR/popularity/hybrid experiment, full-file overlap audit, temporal metrics and bundled app content model | Improved research quality, canonical product/work mapping, larger overlap cohorts and promotion gates |

## Ordered next slices

1. **Hosted identity and data contract.** Connect AuthKit for the first native target and browser preview, register exact callbacks and store tokens securely. Apply migrations to a disposable database, define account ownership and test returning-user/onboarding recovery. Never grant creator privileges from a role selector.
2. **Live catalog and ledger.** Implement server-only TMDB/IGDB adapters. Debounce/paginate search; display attribution, poster fallbacks, provenance and credits. Use series-level TV logs initially; season/episode progress is later. Verify search → detail → log survives restart, retries do not duplicate writes, and old logs remain readable through provider outages.
3. **Lists and profile sync.** Sync ordered unique favourites and list items, preserve local edits and handle conflicts. Enforce private/friends/public visibility server-side. Host the implemented image uploads and claim drafts; add moderated verification without claiming ownership from the demo creator role.
4. **Real messaging and settings.** Add handle lookup, one-to-one participant permissions, cursor history, retry/idempotency and unread states. Reject blocked senders, keep DMs out of training, and implement account export/deletion across derived data. Enable system notifications only with user permission.
5. **Recommendation research.** Start with bounded Amazon overlap audits and train-only canonical mappings. Compare popularity/semantic/BPR before complex cross-domain transfer. Report per-domain and cold-start cohorts, confidence intervals and leakage exclusions. Use the existing Colab/math documentation as the experiment specification.
6. **Buddy and mobile packaging.** After useful retrieval is measured, connect allowlisted internal tools and model routing. Continue to gray out Buddy until the flow is reliable. Package the shared UI for Android through Tauri only when mobile signing/toolchains and lifecycle tests are ready; do not reinstall an emulator for the desktop preview.

## Design and verification

All ten supplied Figma nodes have reference exports and source specifications in `docs/design`. The implementation adapts their visual language to a real desktop canvas and phone viewport; it does not show screenshots as the interface. It adds missing signup/onboarding, log/list editors, settings, privacy/export, empty states and message drafts.

Verify business constraints with unit tests, real workflows with browser tests, screenshots at desktop/phone widths, and the native Rust build. Browser screenshots do not substitute for WKWebView or Android lifecycle testing. Prefer one completed, authorized end-to-end slice over broad UI claims backed by unimplemented services.

## Catalog update — 2026-11-11

Implemented server-only TMDB and IGDB integrations, image configuration caching, selected-field/paginated search, lazy expanded details, credits, collection/similar-work links, token refresh, rate gates, persistent cache, frontend debounce/cancellation, partial/failure states and saved metadata snapshots. Verified live credentials and isolated mock tests. The curated mood/creator collection remains separate from live title search. Hosted auth, user sync, messaging and Buddy are unchanged. See `CATALOG_API.md` and `VALIDATION.md`.

## Creator rooms and mobile composition — 2026-11-12

Implemented live TMDB people/IGDB company search, provider credits, customizable creator rooms, membership icon/glow, local claim requests/withdrawal, account images and identity editing, rotating editorial spotlights and mobile poster composition. Ownership approval remains an authenticated server integration. See [CREATOR_PROFILES.md](CREATOR_PROFILES.md).

## AI training and local recommendations — 2026-11-16

Completed Amazon ratings preprocessing, BPR training, validation-selected hybrid evaluation and independent curated TF-IDF/SVD fitting through Colab CLI. Home now shows local content picks with format filtering. The collaborative benchmark failed promotion; it remains a private research artifact. See [process, results and hosting plan](../ml/notebooks/TRAINING_RESULTS.md). Buddy chat, graph/social models, live-catalog content indexing and hosted collaborative inference remain future work.
