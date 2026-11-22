> Current catalog update: [provider reconciliation and UI source distinctions](CATALOG_RECONCILIATION.md) now apply. Built-ins use canonical provider IDs, SQLite records and the reprojected v3 index. Buddy lists preserve their origin label and lavender treatment through editing/reload.

# Home recommendations and Buddy: free-only OpenRouter routing

Research follow-up: [adaptive personalised classification and changing weights](../ml/notebooks/ADAPTIVE_PERSONALIZATION_RESEARCH.md) describes the proposed shared preference layer, local user adaptation, event requirements and evaluation. It is a research plan, not an enabled classifier.

Implemented local preview, updated 2026-11-16. Home keeps its existing on-device content ranker. Buddy now has a working backend endpoint and a list/conversation interface at **Buddy & friends**. Only the two explicitly approved free OpenRouter models are allowed. Earlier Jev/Gemini suggestions are superseded by this configuration.

## User flow

1. **Retrieve candidates from catalog descriptions, genres and themes using semantic similarity.** Buddy searches the live TMDB/IGDB catalogs rather than restricting retrieval to the 12 built-ins. A bounded Nemotron search plan extracts themes, explicitly mentioned inspiration titles and directors/studios. A deterministic plan remains available on quota/failure. Provider title search, keyword/genre discovery, inspiration recommendations and director/studio credits supply real candidates. The measured Kaggle TF-IDF/SVD transformer projects new public descriptions, tags/themes and creator names at request time; missing index artifacts fall back to keywords. This is bounded provider-wide discovery, not an exhaustive offline index of every provider title.
2. **Apply constraints such as medium, already-seen exclusions and verified duration.** The app excludes favourites and logs before reranking. Explicit format controls and the narrow “games only”/“films only”/“series only” refinement parser apply hard filters. A duration cap admits only server-owned numeric `verified_duration_minutes`; unknown durations are excluded. The provider-backed snapshot has verified runtimes for its films; game playtime and total-series runtimes remain unknown and are excluded by a time cap. Display strings and scraped raw completion fields are not treated as verified minutes.
3. **Rerank the shortlist for thematic fit.** OpenRouter Perplexity Decider scores each real candidate against the supplied theme using typed rubric questions. It replaces the previously proposed Jev integration. Shortlists are bounded at 30, with up to 12 displayed results. The preview mixes 0.75 normalized thematic score, 0.15 retrieval affinity and 0.10 bounded log rating-count support and applies MMR (0.85 relevance, 0.15 redundancy); these are initial settings, not validated optimums. Provider failure keeps local retrieval scores. An unavailable, refused, malformed or partially answered rubric is not interpreted as evidence of irrelevance.
4. **Show real catalog cards with grounded explanations and a Save list button.** Each result carries actual catalog tags and its source description. Model-generated titles/IDs cannot enter the ranking response. The user previews cards, enters a list name and selects Save list; ordinary local validation/persistence creates a private list. The AI has no write tool and cannot save anything by itself.
5. **Support refinements such as “more hopeful” or “games only.”** Send the refinement as the next message; structured conversation context retains the original theme. The combined request is re-retrieved and reranked. “More hopeful” changes semantic/thematic scoring; supported format-only phrases also trigger deterministic filtering. Duration is controlled by its explicit input; arbitrary natural-language constraints are not silently treated as reliably parsed hard filters.

Buddy now defaults to **Chat & recommendations**. Conversation runs the same catalog retrieval, hard filters and Decider ranking as list generation, then gives Nemotron the actual selected records to explain. Both styles return real cards with selection controls and Save list. List only skips the language-model explanation; it is optional, not a required mode switch. Existing fictional friend conversations remain separate local drafts.

A bounded conversation transcript and structured context retain the theme, effective medium, duration cap and previous pick IDs. The frontend shows at most ten exchanges and sends only the last six user/assistant messages plus validated context. State lives in the open Buddy panel, not a server session or account history; New conversation, leaving the panel or switching accounts clears it. “Games only” retains the original theme; simple numeric requests such as “under 2 hours” update the verified-duration filter. Explicit form controls can clear filters. Questions such as “why does the first one fit?” retain the previous shortlist rather than silently replacing it. Requests for different suggestions exclude the last shown IDs.

Nemotron is asked for structured JSON: a short plain-text reply and exact referenced catalog IDs. The server attaches verbatim excerpts directly from those records rather than asking the model to transcribe quotations. Unknown IDs, missing references, invalid optional generated quotations and the old false catalog-access disclaimer are rejected, retaining a deterministic catalog reply and real cards if generation fails. Source excerpts become card explanations. Prose is still model-generated; these validation rules are not a proof that every interpretation is factually correct. No model can write to accounts or save lists.

Decider’s normalized rubric scores below 0.5 are excluded rather than used to fill an unrelated list. This is a conservative preview setting, not a measured quality optimum. If a model fails, local retrieval can still produce explicitly labeled fallback cards. Greetings are handled locally. When no records match, Buddy returns an honest catalog-empty response instead of asking a source-free language model to invent suggestions. The UI reports the providers searched and the candidate-pool size. It distinguishes live discovery, cached fallback and discussion of previous picks; it never presents the 12 homepage titles as the search boundary.

## Deterministic model selection

| Task | Execution | Model / endpoint |
|---|---|---|
| Home recommendations | On device; no OpenRouter call | `provider-catalog-tfidf-svd-v3` vectors + profile ranker |
| Buddy search plan | Server → approved free Chat Completions | Nemotron extracts search phrases; deterministic fallback |
| Buddy candidate retrieval | TMDB/IGDB discovery → local CPU | Public provider search + request-time TF-IDF/SVD projection; keyword fallback |
| Buddy “Make a list” | Server → OpenRouter Decisions | `perplexity/pplx-decider-v1.3:free`, `POST /api/alpha/decisions` |
| Buddy “Chat & recommendations” | Live discovery → local retrieval → free Decider ranking → OpenRouter Chat Completions | `nvidia/nemotron-3.5-super-vl:free`, `POST /api/v1/chat/completions` |
| Free model outage or quota exhaustion | Local fallback/status | No alternative hosted model |
| Save list | Client validation + local store | No model |

`backend/app/model_router.py` owns the hard-coded allowlist and task-to-model routing. `backend/app/buddy.py` owns retrieval, constraints, orchestration and the validated request. `backend/app/buddy_discovery.py` owns bounded provider discovery and metadata hydration. The client selects an application mode, never an arbitrary model name. Unknown model/task overrides are rejected; no request-classification LLM is needed to decide which model to use.

Decider is a decision model, not a chatbot. Its shared `state` contains the explicit theme; each independent question carries exactly one public candidate’s description/tags/creator and returns a value on an ordered four-level 0–3 rubric. The backend validates every answer type/range, divides by three, and maps scores back to its own candidate IDs. Nemotron receives the explicit request, up to six recent Buddy messages and selected public catalog records, with bounded output and reasoning disabled. It no longer receives an instruction to redirect catalog requests to another mode. No tools, search plugins or model fallback array are sent.

Official references: [Decisions API](https://openrouter.ai/docs/guides/features/decisions), [Nemotron free endpoint](https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free), [Decider free endpoint](https://openrouter.ai/perplexity/pplx-decider-v1.3:free).

## Free-only safeguards

- Only the two exact `:free` IDs are accepted. No paid counterpart, Jev, Gemini, auto-routing alias or model fallback list is configured.
- Before inference, fetch the ordinary model catalog and the separate `output_modalities=decisions` catalog. Cache metadata for five minutes; reject a missing model or nonzero prompt/completion/request price. The separate catalog is essential: the default listing does not include the selected decision model.
- Every request supplies zero prompt/completion price ceilings and disables provider fallbacks. An upstream error does not retry against a paid route. Provider failures, 429s and malformed output produce a safe local fallback/status.
- Verify returned model identity against the requested ID, its un-suffixed name or the canonical slug from the trusted model listing. Decider currently returns a dated canonical slug. Reject unexpected identity and any nonzero reported usage cost. Input checks and zero-price routing constrain calls before they are sent; the response-cost check additionally catches a provider discrepancy.
- Keep inference bounded: 2 concurrent model calls, 10 attempts/minute per backend process, no automatic inference retries, 35-second inference timeout, 900 grounded-conversation output tokens. A discovery conversation can use three free inference calls (search-plan extraction, ranking, explanation); list-only turns use up to two. Search planning has an eight-second cap and a deterministic fallback. Provider discovery has a twenty-second budget, retaining successful branches, and metadata hydration has an eight-second per-request cap. The frontend allows up to 120 seconds for the combined pipeline. These local limits are independent of OpenRouter's changing account quotas. Do not assume free capacity is unlimited or guaranteed. [OpenRouter limits](https://openrouter.ai/docs/api/reference/limits), [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection).
- Router exceptions contain safe error codes only. Upstream response bodies, authorization headers and secrets are not returned to the browser or printed by verification scripts. API responses have `Cache-Control: no-store`; personalized responses are not shared in a global cache.

The price metadata and both API contracts were checked live on 2026-11-16 using synthetic/public prompts. This establishes connectivity, routing and zero reported token cost for those checks, not thematic ranking quality or guaranteed future availability.

## Credential storage and privacy

The supplied key is stored only in `backend/.env` as `OPENROUTER_API_KEY`, with file mode **0600**. The existing `.gitignore` excludes `.env`. Preserve existing TMDB/Twitch credentials in that file. `.env.example` contains an empty placeholder and a disabled default feature flag; no key belongs in frontend environment variables, model artifacts, screenshots, documentation or browser requests. The Settings field is excluded from `repr`.

Local configuration:

```dotenv
OPENROUTER_API_KEY=<set privately in backend/.env>
BUDDY_ENABLED=true
```

The request UI states that prompts and public catalog descriptions go to free AI providers. Exclusion IDs go to our local backend solely for filtering; account IDs, email, notes, raw ratings/history and artwork are not included in OpenRouter payloads. Up to 500 favourite/logged work IDs are sent for local filtering, including previously discovered provider titles; exclusions are not sent to OpenRouter. Explicit prompt text can itself contain personal data, so users should not enter confidential information. NVIDIA's [free endpoint notice](https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free) describes provider logging/data use; no zero-retention guarantee is claimed.

`BUDDY_ENABLED=false` returns 503 for the Buddy endpoint. With Buddy enabled but no usable key/free provider, catalog retrieval still produces a degraded local result; conversation returns an unavailable message rather than fabricated chat. The frontend always exposes the preview entry point and handles a disabled/offline backend visibly.

## Setup and scripts

From the repository root, with the existing backend environment:

```sh
.venv/bin/python -m pip install -r backend/requirements.lock.txt
.venv/bin/python scripts/prepare_buddy_index.py
.venv/bin/python scripts/check_models.py
# Optional: one synthetic live call per approved model, consuming free quota.
.venv/bin/python scripts/check_models.py --live
pnpm api
# In another terminal:
pnpm dev
```

`prepare_buddy_index.py` copies the measured content transformer, vocabulary and app vectors from `ml/artifacts/kaggle-remote/` to ignored `backend/data/buddy/`, validates dimensions/finite arrays and writes file checksums. An alternate source directory can be supplied as its positional argument. This requires the downloaded Kaggle training bundle from Notebook 04; a fresh checkout without that bundle uses the visible keyword fallback. NumPy 2.2.6 is added to the backend lockfile; scikit-learn/PyTorch are not required for this serving path. The exported analyzer/stopwords, vocabulary, IDF and SVD components reproduce the training transform without pickle.

The model check script reads the ignored environment, prints only configured/free-availability/status information and exits nonzero on failure. Its default mode performs catalog checks without inference. It does not print the key or full provider replies.

The backend catalog fixture is `backend/models/catalog.json`, copied from the current app-owned catalog. Keep its IDs/metadata synchronized when rebuilding the index. The built-in snapshots remain small for offline Home ranking. Buddy independently discovers live provider records, projects their metadata using the fitted transformer and persists resolved public records in the existing canonical SQLite table for subsequent turns. It does not import unidentified Kaggle rows as real provider cards.

## API and UI

`POST /v1/buddy/query` accepts:

```json
{
  "mode": "recommendations",
  "prompt": "Eerie stories about isolation",
  "refinement": "more hopeful, games only",
  "medium": "all",
  "exclude_ids": ["cyberpunk"],
  "max_minutes": null,
  "limit": 6
}
```

`mode` is `recommendations` or `chat`; medium is `all`, `game`, `movie` or `tv`. Prompt length is 1–2,000 characters, refinement at most 500, exclusions at most 500, result limit 1–12. Unsupported fields such as `model` or `api_key` fail schema validation. Whitespace-only requests fail validation.

Responses include `reply`, `items`, `route`, `model`, `models`, `context`, `referenced_ids`, `evidence`, `catalog_size`, `discovery`, `degraded` and `free_only`. Optional request `context` holds a bounded theme, effective filters and up to 12 previous IDs; optional `history` holds at most six role/content entries, 2,000 characters each. All supplied state is validated and treated as untrusted data. The request’s legacy default remains `recommendations`; the frontend explicitly defaults to `chat`. Recommendation responses also identify the retrieval model and effective medium; each item has a real `work`, factual `reason`, catalog `evidence` and an internal ranking `score`. Scores are ranking signals, not validated probabilities that a user will like a work. Disabled service returns 503, busy service 429, and invalid input 422. CORS now permits POST from the existing exact app origins.

`BuddyPanel.tsx` implements a conversation transcript, follow-up composer, example requests, collapsible format/preferences controls, card selection, evidence disclosure and explicit local list save. Recent Buddy conversation is transmitted for context; unrelated friend messages, notes, account IDs and raw logs are not. `buddy-api.ts` sends requests only to the existing catalog backend URL. Home's Buddy strips link to this interface. ChatPage starts on Buddy; selecting Ari/Milo still opens local fictional-message drafts. AI replies are rendered as plain text, not executable HTML.

## Verification and remaining work

- Both exact approved model IDs are listed at zero price and passed live API checks with the stored key. Decider's Decisions contract and dated canonical response were verified separately from Chat Completions.
- Backend tests cover route/endpoint selection, zero-price enforcement, missing models, unexpected responses, refusals, non-finite scores, no inference retry/secret echo, API schema/CORS and catalog constraints/fallbacks.
- Frontend/browser verification covers list refinement/save/reload, conversation routing, API errors, fallback status and mobile overflow, alongside existing workflows. See `backend/tests/test_buddy.py` and `apps/desktop/e2e/buddy.spec.ts`.
- Independent thematic relevance evaluation, broader verified game/series durations and sentence-encoder benchmarking remain necessary before quality/promotion claims. The earlier Amazon BPR failure and aggregate-score regression metrics do not measure Buddy relevance.
- This is a loopback/local-preview service. Shared/public hosting must add verified authentication, account-scoped authorization and distributed rate controls before exposure. Existing local preview identity is not trusted server authentication. No hosted deployment, paid model or new subscription was created.

## Live discovery implementation — 2026-11-16

The 12 built-ins are a homepage/offline selection, not the Buddy search corpus. Each discovery request can query the full configured provider catalog through bounded search/discover operations. TMDB keyword IDs and genre IDs drive movie/TV discover queries; named inspiration titles supply real descriptions, themes, provider recommendations and primary creators. Only director credits contribute creator-based movie/TV discovery. IGDB resolves keyword/theme/genre IDs first and filters games numerically, also following actual developer-studio IDs. Expanded string predicates across many IGDB fields timed out in live checks and are deliberately avoided. Provider-generated numeric IDs are the only IDs admitted; models never construct provider queries. Query strings are escaped and taxonomy endpoints are allowlisted.

The candidate pool deduplicates canonical IDs and combines newly found records with up to 1,000 recently resolved public works. The 30-work model shortlist reserves space for each requested format. Rating-count support is a bounded ranking signal, not a quality guarantee. Inspiration titles can guide retrieval even if excluded as seen, but are not themselves returned as next picks. Known edition parent IDs respect seen exclusions; direct discovery excludes alternate game editions. Explicit erotic game themes are excluded consistently with the existing non-adult TMDB discovery defaults.

Selected cards are hydrated for source details, studios/directors and keyword metadata. Duration requests hydrate up to 30 preliminary movie candidates, then enforce verified numeric runtimes; game and whole-series runtimes stay excluded when unknown. Successful branches survive provider outages/timeouts. Cached fallback and partial search are labeled honestly. Newly discovered records remain available for “why does the first one fit?” without another live search, and saved-list snapshots preserve the actual cards across reload. Public search metadata is cached; user prompts and conversation state are not stored in the global provider cache.

Provider contracts: [TMDB discover filters](https://developer.themoviedb.org/reference/discover-movie), [TMDB keyword lookup](https://developer.themoviedb.org/reference/search-keyword), [IGDB filtering and editions](https://api-docs.igdb.com/#filters).

Classification isolation: shared candidate-array indices produced observed cross-record confusion at larger batch sizes (for example an unrelated film was scored as cyberpunk). Each independent score question now carries exactly one candidate’s public metadata, while the shared state contains only the request/inspiration. This removes array indirection and unrelated records from each judgment. Search summaries are saved with `remember()` so they cannot erase previously resolved creators or verified runtimes; full details use `update()`.
