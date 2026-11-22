# Validation record — Tauri migration

Checked 2026-11-07. This document describes the current Tauri implementation; the deleted Kotlin prototype's build results are no longer relevant to the runnable app.

## Passed

- `pnpm build`: strict TypeScript check and Vite demo bundle.
- `pnpm test`: **10 tests**, covering rejected credentials, disabling demo auth, persistent active sessions/ledger, account isolation through logout/switching, salted local signup credentials, corrupt-state recovery, storage errors, half-star/known-title validation, Top 4 limits, mixed-media list validation and search filters.
- `pnpm test:e2e`: **3 browser workflows** on desktop and phone widths. They cover rating/note logging, reload persistence, list creation across formats, saved privacy preferences, creator-account isolation, Top 4 editing, persisted local chat drafts, disabled Buddy, poster loading and no horizontal overflow on the core mobile screens.
- `python3 -m unittest discover -s ml/tests`: **4 model-pipeline checks** still pass after the migration.
- Native `cargo build` completed with Tauri 2.12.5 and tauri-build 2.7.4.
- `pnpm --dir apps/desktop tauri build --debug --bundles app`: created **Distran.app**, approximately **28.20 MiB**, at `apps/desktop/src-tauri/target/debug/bundle/macos/Distran.app`.
- Opened the native app on the local macOS desktop. Browser captures of the shared UI are in `docs/preview/`.

## Cleanup completed

Removed `apps/android` (Kotlin/Compose, Gradle wrapper/cache/build outputs, IDE/run configuration), the Android preview launcher, obsolete Compose screenshots and the unused Android 30 system image created for this project (approximately 3.1 GB). Also removed the approximately 400 MB Android rendering/Gradle helper packs downloaded only for the obsolete preview. The new client uses one root pnpm workspace/lockfile; its redundant standalone dependency copy was removed. Backend/model source, notebooks, research and original Figma/presentation references were preserved.

## What was actually exercised

Browser tests use isolated local stores; they do not send real messages, train production models or authenticate with WorkOS. Screenshot capture fast-forwards page animations to record completed states. The initial selector failures were fixed to use the correct searchbox semantics; testing also found and fixed a chat effect returning a new browser scroll Promise instead of a cleanup function.

The native shell was compiled, bundled and opened. The browser workflow tests use Chromium, so they do not establish that every interaction has passed on macOS WKWebView, Android or iOS. No native mobile package, release signing/notarization or publicly deployed backend is claimed. The live-provider verification is recorded in the catalog update below.

## Pending services

At the migration checkpoint, catalog data was local fixtures. The catalog update below supersedes the live-search limitation. Hosted AuthKit, authorized sync/sharing, peer messaging, creator verification and model-based recommendations remain integration work. Buddy and external connections are disabled. SQL remains an unapplied draft. Colab notebooks and BPR code remain available; no real-data model was trained during this UI migration.


## Live catalog integration — 2026-11-11

- Supplied credentials are configured only in ignored `backend/.env` (0600); feature responses contain booleans only. A scan found no credentials in frontend source, built assets or documentation.
- Real provider checks passed for TMDB movie search/details (Interstellar), TMDB TV search/details (Severance), and IGDB game search/details (Cyberpunk 2077 search, returning multiple editions). Verified creators, posters and related works. The first cold movie request took approximately 11.65 s on this network; game search 2.09 s and TV search 0.27 s. This is not a latency SLA.
- Through the restarted local gateway, persisted-cache search hits took 15.40 ms for the first HTTP connection, then 0.86–1.84 ms across movie/game/TV repeats. The response headers reported cache hits; no upstream calls were needed for those repeats.
- Backend mock suite: 8 tests passed for persistent caching/single-flight, stale fallback/bounds, token reuse/refresh, escaped queries, rate spacing/429 handling, partial failure, details/collection normalization, parameter validation and CORS/secret isolation.
- Frontend unit suite: 11 tests passed, including snapshots of saved provider works.
- Browser suite: 5 workflows passed, including mocked live search debounce, lazy details, offline saved metadata and partial-provider pagination. Existing account/ledger/list/mobile flows still pass without consuming live quotas.
- Strict TypeScript/Vite bundle passed; updated native Tauri debug app bundle built successfully with the gateway/image CSP additions.
- The API is a separately running loopback service (`pnpm api`); the native bundle contains neither provider credentials nor a bundled Python server. Public deployment, shared multi-worker throttling, hosted identity and account sync remain future work.

Final check on 2026-11-12: the updated native executable and frontend assets were scanned for all configured provider credentials; none were present. The actual gateway → TMDB → UI smoke check rendered Interstellar with Christopher Nolan and no page errors (`docs/preview/live-tmdb-title.png`).


## Creator rooms and mobile title pages — 2026-11-12

- Frontend: **14 unit tests** pass, including pending-only claims, role/evidence/duplicate validation, unique usernames, saved image/creator fields, claimed provider-work snapshots and private creator visibility.
- Backend: **10 tests** pass, including creator search/details, escaped company filters, provider endpoint/cache isolation, token reuse, credit normalization, partial provider failures and parameter validation.
- Browser: **9 workflows** pass in Chromium, including creator customization/reload, claim request/withdrawal, picture/banner upload and persistence, name/username editing, creator search and membership badge, provider follow links, spotlight controls, centered enlarged mobile poster and stats/action placement. Existing ledger/list/account/catalog workflows still pass.
- Visual inspection: `creator-page-desktop.png`, `custom-profile-mobile.png`, `poster-title-mobile.png` in `docs/preview/`. Mobile Dune poster is centered at approximately 249 px wide at a 390×844 viewport; all title actions remain available. Desktop title arrangement is preserved.
- Actual provider checks: Christopher Nolan search and combined credits succeeded (20 works in the bounded selection); CD Projekt RED creator details returned 40 developed games. IGDB's `search` clause returned no known studios; the documented case-insensitive name filter was verified to return CD Projekt RED and related companies. A live Interstellar detail carries the stable creator link `tmdb:person:525`.
- Representative cold gateway reads on this network: Nolan search 1.97 s; creator details 0.27 s; corrected CD Projekt search 2.44 s. These are observed timings, not a service SLA. All provider read paths share the existing persistent cache and throttles.
- Strict TypeScript/Vite production-asset compilation and Tauri debug `.app` bundling succeeded. The bundle is at `apps/desktop/src-tauri/target/debug/bundle/macos/Distran.app`.

Claims remain local pending requests; verified ownership, moderator review, shared account sync and hosted image storage are not implemented. The glow represents local Distran membership. Chromium browser tests do not establish WKWebView file-picker or native mobile lifecycle coverage. See [CREATOR_PROFILES.md](CREATOR_PROFILES.md).

## Buddy free-only routing — 2026-11-16

Verified both approved OpenRouter models live with public synthetic prompts: Nemotron through Chat Completions and Perplexity Decider through Decisions. Zero reported usage cost; dated canonical Decider identity matched catalog metadata. A full live Buddy API request used the measured TF-IDF/SVD index, returned three game candidates, respected a seen-title exclusion, and reported no degradation.

18 backend tests, 18 frontend unit tests, a TypeScript/Vite build, and six focused browser flows passed (account/ledger/list persistence, mobile friend drafts, screenshots, Buddy refinement/list save/reload/chat, backend errors/fallback, and home recommendations). Screenshot artifacts are in the ignored frontend test-results directory. The key's owner-only file mode and absence from source/docs/frontend build were checked without printing it. These are functional/routing checks, not recommendation-quality evaluation.

## Recommendation identity and provider reconciliation — 2026-11-16

20 frontend unit checks, 22 backend checks, the TypeScript/Vite build and all 13 browser flows passed after migrating built-ins to canonical IDs. Live provider reconciliation confirmed all 12 work IDs, developing studios and director credits, including TV series-director priority. The SQLite built-in endpoint, user-data migration, actor/company creator links, cached creator pages and persistent Buddy-list source marker have regression coverage. Normal picks, editorial collections and related works have neutral source labels; Buddy cards/lists have a text/icon label and restrained lavender glow. Desktop/mobile screenshots were inspected. The optimized native macOS build completed successfully and produced `apps/desktop/src-tauri/target/release/bundle/macos/Distran.app` (12.92 MiB). The local API is running on port 8000; a live Buddy request used the v3 provider index and the approved free Decider model, returned one eligible film under 120 verified minutes and reported no degradation.

Launched the newly bundled macOS application with `open -n`; the native `distran` process was confirmed running. Native process launch and API connectivity are verified separately from the Chromium browser workflow suite; no claim is made that every browser test was repeated inside WKWebView.

## Grounded Buddy conversation — 2026-11-16

Fixed the early-return chat branch and system instruction that redirected users to Make a list. Conversation now retrieves and ranks real catalog cards, then generates a source-grounded Nemotron reply with validated IDs/excerpts. Live public-prompt verification returned Blade Runner 2049, Edgerunners and Cyberpunk 2077 for a cyberpunk request; “games only” retained the theme and returned Cyberpunk 2077. Both calls used the approved free ranking/conversation models and reported no fallback.

27 backend checks, 20 frontend unit checks, the TypeScript/Vite build and all 13 browser flows passed. New coverage checks grounded payloads, rejection of unknown IDs/fabricated quotes/false access disclaimers, relevance filtering, preserved follow-up context, stable explanatory follow-ups, duration parsing/persistence, default chat returning selectable cards, private list save/edit/reload, New conversation and error fallback. Conversation history is transient and bounded; catalog coverage remains 12 indexed works.

The optimized native macOS bundle was rebuilt and launched with the updated conversation interface. The local API was restarted; an actual HTTP chat request to `/v1/buddy/query` returned three canonical cyberpunk cards, structured follow-up context and a grounded reply using both approved free models, with `degraded: false`. Backend and native processes were confirmed running. Chromium flow coverage remains separate from native WKWebView verification.

## Live provider-wide Buddy discovery — 2026-11-16

Buddy now discovers real candidates across configured TMDB/IGDB catalogs using title, keyword/genre/theme, inspiration recommendation and director/studio queries. The 12 built-ins remain the Home/offline selection. IGDB taxonomy IDs replaced slow nested string filters; independent per-candidate classification questions replaced ambiguous shared-array indirection after live tests exposed cross-record confusion. Source excerpts are attached directly from public records, and partial search summaries cannot erase resolved creators/runtimes. Existing built-ins were refreshed with full provider details after verification.

- Live loopback `Cyberpunk stories across formats`: Altered Carbon, The Red Strings Club, VA-11 Hall-A: Cyberpunk Bartender Action, Cyberpunk Videozine 1, Steins;Gate. 506 public candidates available; 10.16 seconds observed, not a latency guarantee. Both approved free models returned usable answers; no model fallback or provider errors. All 12 built-ins were excluded in the request.
- Live loopback `games only`: Remember Me, Stray, Metal Gear Rising: Revengeance. 506 public candidates available; 5.37 seconds observed, not a latency guarantee. Both approved free models returned usable answers; no model fallback or provider errors. All 12 built-ins were excluded in the request.

36 backend checks, 20 frontend unit checks and all 13 Chromium browser flows cover constraints, dynamic catalog persistence, seed exclusion, source isolation, format representation, metadata preservation, provider outages, grounded replies and list persistence. TypeScript/Vite compilation and optimized native macOS bundling succeeded (12.92 MiB). The updated app and final API were launched. Credential scan found no configured provider secrets in frontend source, compiled assets or docs; ignored server environment remains mode 0600. Browser coverage is separate from native WKWebView verification; the live cases are functional probes, not a relevance benchmark or exhaustive provider-corpus evaluation.
