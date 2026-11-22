# Architecture

## Client: Tauri 2 with React and TypeScript

Tauri owns the native application window; React renders the shared interface. Vite builds and serves the frontend. Hash-based routes work in the browser, the development WebView and the packaged app without server rewrites. The native shell has only `core:default` capability permissions; it does not expose filesystem, shell or general network plugins. Fonts and curated artwork are bundled locally; live posters use the explicitly allowed TMDB/IGDB CDNs. A content security policy restricts content to those approved image origins, local assets and the loopback API/development origins. [Tauri configuration](https://v2.tauri.app/reference/config/).

The current native target is macOS. Phone-width composition is implemented in CSS, with bottom navigation and responsive dialogs. Native Android/iOS builds are future work and still require their respective platform toolchains; switching to Tauri does not remove that eventual requirement. macOS uses WKWebView, so Chromium frontend checks complement, rather than replace, native validation. [Tauri WebViews](https://v2.tauri.app/reference/webview-versions/), [prerequisites](https://v2.tauri.app/start/prerequisites/).

Screen components are in `src/pages`, common UI/editors in `src/components`, and domain data rules/persistence in `src/lib`. CSS is divided into foundation, room, authentication, discovery, title, collections, people and responsive layers. There is one dependency workspace and lockfile at the repository root. Rust dependency versions are locked independently in `src-tauri/Cargo.lock`.

## Local preview data

The local preview uses a deliberately small curated catalog. `catalog.ts` retains curated fixtures and a registry of provider works. Discover now calls the live FastAPI gateway through `catalog-api.ts`; `use-catalog.ts` handles debounce, cancellation and state. Saved user works include metadata snapshots. `store.ts` contains account, logging, list and favourite rules; `context.tsx` coordinates React state and commits. A write must succeed before the in-memory state is advanced. Forms display save failures rather than claiming success.

Data is versioned in localStorage and partitioned by account. The active local account ID restores the session on launch. Fixture credentials are public and enabled only by the explicit demo environment flag. Additional local signup passwords use salted PBKDF2. This is not a secure substitute for hosted identity: a user with access to the local WebView store can edit data. No API endpoint trusts this local session. Production frontend mode disables local authentication entirely until hosted identity is integrated.

The current JSON data layer keeps the migration small and reviewable. Replace it through a repository boundary with a server-backed client and, if needed, a SQLite offline cache once synchronization requirements are concrete. Do not move provider secrets into frontend environment variables or Rust binaries. The root `.env.example` remains backend-only; the committed frontend env files contain the public demo flag only.

## Backend: FastAPI + managed PostgreSQL

Retain FastAPI → managed Supabase PostgreSQL as the initial backend. It fits relational catalog identities, cross-media edges, ordered lists, log history and conversations. Use pgvector when semantic retrieval is ready, and SQL/full-text search before adding a dedicated search service. Start with a scheduled Python ingestion worker and a database job table with leases/retries. Colab trains experiments; it does not serve the production API.

Supabase documents WorkOS as a supported third-party auth provider. Firebase is an alternative for mobile messaging, but the catalog and permission model fit SQL well. Self-hosting adds operational work that is unnecessary for the first school milestone. This is an engineering decision for this scope, not a comparative benchmark. [Supabase third-party authentication](https://supabase.com/docs/guides/auth/third-party/overview).

The backend now exposes normalized live catalog search and title details alongside health, feature flags and the disabled Buddy endpoint. It uses pooled httpx clients, a bounded persistent SQLite cache, token refresh and single-process rate gates. See `CATALOG_API.md` for implemented policies. The SQL migration is a draft, not an applied production schema. It enables RLS with no direct-client policies; public client queries therefore fail closed. Trusted service credentials bypass RLS, so API-level ownership/membership checks remain mandatory.

## Hosted authentication integration

Use WorkOS AuthKit in the system browser with authorization-code PKCE, state validation and registered platform callbacks. Tauri deep-link and browser-opening capabilities should be added narrowly when this slice is implemented. Evaluate the official supported callback flow for each target. A desktop callback URL must not simply reuse a native Android custom scheme without checking its registration and interception model. `npx workos@latest` provisions/configures AuthKit; it does not generate a secure native integration automatically. [WorkOS docs](https://workos.com/docs).

The API verifies JWT signatures, configured issuer/audience, expiry and subject with provider JWKS, then maps subject to an internal UUID. Never trust request-supplied user IDs. Store production refresh credentials in an OS-backed secret store, not the preview's JSON record. Preserve the ability to sign out, export/delete account data and resume onboarding after interruption.

## Catalog and API boundaries

Server adapters now provide TMDB movies/TV and IGDB games. They retain provider-qualified IDs; canonical UUID reconciliation is still future database work. Normalize internal work UUIDs, namespaced external identifiers, artwork, credits, people/companies and related works. Persist provenance, fetched_at and rights/attribution notes. External ID matches take precedence; title/year fuzzy matching should propose a reviewed link rather than silently merge editions, remakes or unrelated namesakes.

Implemented read contracts: `/v1/catalog/search`, `/v1/works/{id}`, `/v1/creators/search` and `/v1/creators/{id}`. Planned authenticated contracts: `/v1/me`, `/v1/logs`, `/v1/lists`, `/v1/favorites`, `/v1/conversations`, `/v1/messages` and `/v1/recommendations`. Use cursor pagination and idempotency keys for retried writes. Enforce visibility on every read, participant membership for messages, creator verification for title claims and blocks before delivery. Direct messages are excluded from model training.

Provider jobs should cap concurrency, honor throttling and terms, bound retries and serve cached details during outages. Do not bulk ingest entire media catalogs merely to populate a prototype. Provider API access does not automatically grant artwork redistribution or training rights. See the provider research document for original sources.

## Recommendation serving and Buddy

Keep retrieval/ranking separate from the chat language model. A deterministic router chooses semantic-profile retrieval for cold users, evaluated collaborative/semantic hybrids for covered warm users, and a diverse popularity fallback on index/model failures. Routing thresholds must be measured and validated. The production hybrid router remains planned. The home feed now runs a separate bundled TF-IDF/SVD content preview locally; it does not load the Amazon collaborative factors.

Every artifact records model ID, data checksum and terms, split cutoffs, seed, environment, item/user maps, dimensions, feature schema, metrics/cohorts and canonical catalog mapping. Validate compatibility before loading. Shadow/staging evaluation precedes an atomic active-model switch; retain the previous artifact for rollback.

Buddy will call allowlisted internal search/detail/recommendation tools and explain sourced candidates. A list write must follow user intent and ordinary authorization. Background ingestion can propose confidence-scored thematic links with evidence; it cannot silently turn aesthetic similarity into a verified franchise relationship. Creator promotion must not secretly override organic ranking.

Friend-based features are deferred until consented activity and visibility checks exist. Use decay, per-friend exposure caps and removal of private activity at serving time. Keep impression/click/save/hide events separate from logs so missing engagement is not equated with dislike. Current Buddy and external connections remain disabled on both the client surface and scaffold API.

## Creator profiles and local claims

`creators.py` normalizes public directory records; it shares provider/cache/rate-limit infrastructure with catalog reads. `creators.ts` maintains local catalog connections without equating matching display names with verified provider identities. Optional account fields extend local storage without deleting prior data. Pending claims, image limits and the production moderation boundary are documented in [CREATOR_PROFILES.md](CREATOR_PROFILES.md).

## Measured AI run — 2026-11-16

[Training results and deployment plan](../ml/notebooks/TRAINING_RESULTS.md) accompany the executed Colab notebook. The full-file Amazon 5-core audit and bounded user sample were trained/evaluated, but validation preferred popularity and the overall test scores did not justify BPR promotion. `src/lib/catalog-model.json` contains the independently fitted curated catalog vectors; `recommendations.ts` applies local positive/negative profiles, seen-title exclusions, format filters, MMR and editorial fallback. Home displays these content picks without sending history to a backend. No new inference service is required at this size. The live provider catalog is not indexed yet, and Buddy chat remains disabled.

## Kaggle metadata model follow-up — 2026-11-16

The bundled artifact is now `kaggle-catalog-tfidf-svd-v2`, fit on the supplied movie, game-sales and HLTB metadata, with 64-dimensional projected vectors for the same 12 app works. Three offline aggregate-score regressors have title-grouped validation/test results; their predicted scores do not enter personal ranking. Source title/year matches remain proposals, not canonical identity merges. See [the parameters, results and hosting implications](../ml/notebooks/KAGGLE_TRAINING_RESULTS.md).

## Buddy free-only routing — 2026-11-16

`model_router.py` routes thematic rubrics to OpenRouter Decisions (`perplexity/pplx-decider-v1.3:free`) and conversation to Chat Completions (`nvidia/nemotron-3.5-super-vl:free`). No paid fallback exists. `buddy.py` projects queries through the local trained content index, applies constraints and returns only known catalog cards/evidence. BuddyPanel renders results and saves lists through existing local persistence. Free-provider outages degrade explicitly. This supersedes earlier notes describing Buddy as disabled; hosted auth and larger catalog indexing are still pending. [Detailed setup and limits](BUDDY_RECOMMENDATIONS.md).

## Grounded conversation correction — 2026-11-16

Buddy chat no longer bypasses retrieval. The service shares the constrained catalog shortlist with Decider and Nemotron, validates generated references and attaches verbatim source excerpts, returns the same cards/save controls in chat, and carries bounded client-side theme/filter context into follow-ups. Nemotron failure preserves usable catalog results. Chat & recommendations is the default UI; List only is optional. Current database records supply public metadata, while the existing local semantic index supplies retrieval. No paid fallback, model write tool or account-history access was added.


## Live Buddy discovery — 2026-11-16

`buddy_discovery.py` searches configured TMDB/IGDB catalogs independently of the 12-work Home snapshot. It extracts a bounded search plan with approved free Nemotron (deterministic fallback), resolves actual keyword/genre/theme and creator IDs through providers, expands inspiration recommendations and director/studio credits, and hydrates selected records. Numeric taxonomy predicates replace slow expanded IGDB text predicates. The existing trained transformer projects public metadata for dynamic candidates; Decider judges a balanced 30-work shortlist. Canonical SQLite also retains resolved dynamic works for follow-up conversation. `builtins()` still returns only the reviewed Home selection; `known()` supplies a bounded recent public cache. Seen exclusions include dynamic IDs/known edition parents, and duration filters remain verified-only. UI coverage reflects live providers and considered candidates, with cached/partial status. This supersedes earlier fixed-corpus Buddy limitations; exhaustive offline provider indexing remains outside this implementation.
