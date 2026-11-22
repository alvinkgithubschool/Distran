# Live catalog integration

Checked 2026-11-11. The app now searches TMDB and IGDB through the FastAPI gateway. Home/editorial collections remain curated fixtures; hosted account sync, messaging and Buddy are separate work.

## Data path

```text
Tauri / browser
  → 300 ms search debounce, cancelled obsolete reads, 60 s bounded response cache
  → GET local FastAPI gateway (no provider secrets in frontend)
  → persistent SQLite cache + identical-request coalescing
  → pooled HTTP client + provider rate/concurrency gates
  → TMDB / IGDB
```

Image URLs go directly to the providers' HTTPS CDNs with lazy decoding/loading; they do not traverse Python or carry credentials. The Tauri CSP permits only TMDB/IGDB image origins and the configured loopback API. Missing posters show the existing title fallback. No unrestricted image proxy or external-URL fetch endpoint is provided.

## Configuration and identity

Server-only values in `backend/.env`:

| Variable | Use |
|---|---|
| `TMDB_READ_TOKEN` | TMDB bearer read access; do not also send the v3 key |
| `TWITCH_CLIENT_ID` | IGDB application identifier |
| `TWITCH_CLIENT_SECRET` | Twitch client-credentials exchange, server only |
| `CATALOG_CACHE_PATH` | Optional SQLite path; default `backend/data/catalog.sqlite3` |

The local credential file is excluded by `.gitignore`, protected with 0600 permissions and never included in build assets. The temporary Twitch token is held in memory, refreshed 60 seconds before expiry, and refreshed once on authorization rejection. Concurrent refreshes share a lock. Credential-bearing Twitch parameters are sent in a POST form body, not URLs. Error responses expose only provider/code pairs, never upstream response bodies, headers or token strings.

The frontend URL is public configuration (`VITE_CATALOG_API_URL`). Development and demo builds use `http://127.0.0.1:8000/v1`; production builds require an explicit deployment URL and matching Tauri CSP/CORS settings. Restart/rebuild the frontend after changing build-time environment values.

Namespaced work IDs avoid collisions: `tmdb:movie:157336`, `tmdb:tv:95396`, `igdb:game:1877`. Local fixture IDs are retained so old profiles and lists keep working. Automatic merging between local fixtures, game editions/remasters and provider IDs is intentionally not performed.

## Endpoints

### `GET /v1/catalog/search?q=Interstellar&medium=movie&page=1`

- `q`: 0–100 characters; whitespace normalized; control characters rejected.
- `medium`: `all`, `game`, `movie`, or `tv`.
- `page`: 1–50. TMDB returns its provider page; IGDB requests 21 rows to return 20 plus a next-page probe.
- Empty query browses TMDB popular/trending or IGDB games with covers and a minimum rating-count filter.
- `all` runs at most one TMDB multi-search and one IGDB search concurrently. People are removed from TMDB multi results. Provider relevance is preserved and results interleaved; incompatible provider scores are not compared.
- IGDB search text is JSON-quoted before insertion into APICalypse, preventing query-fragment injection. Arbitrary field lists, endpoints and raw provider filters are not accepted.

Response envelope:

```json
{
  "items": [{"id":"tmdb:movie:157336","title":"Interstellar","medium":"movie"}],
  "page": 1,
  "hasMore": true,
  "status": "ok",
  "providers": {"tmdb":{"cache":"hit"}},
  "errors": []
}
```

Actual items also include description, image, year, rating, maker/publisher placeholders when not yet fetched, tags and provenance. Search uses selected metadata fields and does **not** fetch details for every result. Live query semantics are title search, not a trained semantic recommender. Creator/mood entry points stay explicitly in the curated collection.

`status=partial` returns HTTP 200 with available results plus provider failures. If every requested provider fails, HTTP 503 carries an unavailable envelope and the UI labels its local-preview fallback. A successful empty result is an empty search, not a provider failure. `X-Catalog-Cache` reports each available provider's `hit`, `miss` or `stale` state. UI sort is per loaded page, not a global catalog ranking.

### `GET /v1/works/tmdb:movie:157336`

Loads full details only after opening a provider work. Returns `work`, `related`, and `cache`. Details contain maker, production/publishing companies, descriptions, genres, cast/company credits, collections/franchises where provided, and recommended/similar works.

TMDB combines credits, recommendations and external IDs with `append_to_response`. Movie collection parts use one extra cached read when the title belongs to a collection; these are distinguished from recommendations. IGDB expands selected company/genre/franchise/platform and similar-game fields in a single request. Provider recommendations do not establish canonical sequels or cross-media adaptations.

Provider ratings are displayed on a 0–5 scale: TMDB vote_average / 2, IGDB total_rating / 20, with unrated works shown as `—`. TMDB production companies are not mislabelled as verified distributors. User ratings remain independent half-star values.

Logged, listed or favourited provider works are stored as metadata snapshots alongside the local account database. This preserves their display when the backend is offline; search-result-only metadata is held in a bounded in-memory response cache and may need refetching after reload.

### Other endpoints

- `GET /health`: process health; no provider calls or secrets.
- `GET /v1/features`: configured provider booleans; configuration is not an upstream health guarantee.
- `POST /v1/buddy/query`: remains disabled, HTTP 503.

Invalid IDs, media, page ranges or oversized queries return 422; missing provider works return 404; upstream authorization/errors return sanitized 502/503; detail timeout returns 504. CORS accepts only the local browser/Tauri origins, never wildcard access.

## Efficiency and failure policy

| Mechanism | Current policy |
|---|---|
| HTTP reuse | One lifespan-owned AsyncClient; 12 connections, 8 keep-alive connections |
| Upstream timeout | 3 s connect/pool; 6 s ordinary read/write budget |
| Search deadline | 14 s per provider; independent failures allow partial results |
| Detail deadline | 18 s; client request deadline 20 s |
| TMDB gate | Conservative 5 request starts/s, at most 4 concurrent |
| IGDB gate | 3 request starts/s, at most 2 concurrent, below documented 4/s and 8 open |
| OAuth gate | 1/s, serialized token exchange/refresh |
| Retries | Up to 3 attempts for transport/5xx/short 429; jittered backoff; no ordinary 4xx retry |
| Long 429 | Respect a shared cooldown (capped 60 s); fail the current request promptly rather than block for a long Retry-After |
| Persistent TTL | Search/browse 30 min; details/collections 24 h; TMDB image configuration 7 days |
| Stale fallback | Up to 24 h beyond TTL on refresh failure; UI labels stale responses |
| Cache bounds | 5,000 persistent entries, evict oldest writes; at most 100 simultaneous unique refresh tasks |
| Request coalescing | Concurrent identical reads share one refresh; cancelled waiters do not cancel other users' refresh |
| Gateway admission | At most 24 active catalog requests; excess gets 503 |
| Frontend cache | At most 100 request URLs, 60 s reuse; search debounce 300 ms |

SQLite WAL is intentionally lightweight for this single-process local gateway. Its short synchronous reads/writes do not justify a separate service at this scale. Expired/stale data and oldest entries are pruned on writes. It is not a cross-worker rate limiter: **run one worker** while using these in-process gates. For a shared/public deployment, add authenticated admission, a shared Redis cache/rate limiter and observed latency/error metrics before scaling workers or exposing the gateway. CORS alone is not authentication.

For repeatable manual checks with the API running, use `pnpm check:catalog` (it makes up to six read requests, usually served from cache).

Cache hit timing was checked locally; cold-provider latency depends on the upstream network and can be several seconds. No latency SLA is claimed. The priority is avoiding unnecessary calls, not racing provider limits. No bulk-catalog import runs on startup and no provider artwork is used as model-training input.

## Running and troubleshooting

1. Install the checked backend environment and keep `backend/.env` private.
2. Run `pnpm api` from the root; leave it running.
3. Run `pnpm dev` or `pnpm app`; Discover uses the live catalog.
4. If providers are unavailable, inspect sanitized status codes and `/v1/features`, not the secret values. `credentials_rejected` means the upstream rejected the configured token/client credentials.
5. A restart preserves the SQLite metadata cache but obtains a fresh Twitch app token when needed.
6. To clear provider metadata, stop the API before deleting `backend/data/catalog.sqlite3` and its WAL/SHM companions. This does not delete user logs; those live in app storage.

## Primary references

- [TMDB configuration details](https://developer.themoviedb.org/reference/configuration-details): image bases and sizes.
- [TMDB movie details](https://developer.themoviedb.org/reference/movie-details), [TV details](https://developer.themoviedb.org/reference/tv-series-details): appended detail resources.
- [TMDB multi search](https://developer.themoviedb.org/reference/search-multi): movies, TV and people in one response.
- [TMDB rate limits](https://developer.themoviedb.org/docs/rate-limiting): limits may change; respect 429.
- [IGDB API documentation](https://api-docs.igdb.com/): app authorization, selected fields, pagination, images and published limits.

## Creator directory — 2026-11-12

Added read-only `/v1/creators/search?q=…&page=…` and `/v1/creators/{id}` with TMDB people and IGDB companies, stable provider IDs, credits, images, the shared cache/rate gates and partial failures. IGDB company searches use case-insensitive `name` filters; its `search` operation returned empty results for known studio names during live verification. These endpoints do not approve claims or establish ownership. Full contracts and limitations: [CREATOR_PROFILES.md](CREATOR_PROFILES.md).

## Canonical built-ins — 2026-11-16

`GET /v1/catalog/builtins` returns the 12 reviewed built-in works and legacy alias map from `canonical_works` / `work_aliases` in the preview SQLite database. The frontend hydrates this once at startup and retains a bundled provider-derived snapshot for outages. Provider detail reads refresh canonical records while preserving editorial themes/connections and poster fallbacks. `scripts/sync_catalog.py` refreshes reviewed IDs and reprojects the same works for both local Home and backend Buddy retrieval; see [reconciliation details](CATALOG_RECONCILIATION.md).
