# Provider-backed media, creator identity and recommendation presentation

Implemented 2026-11-16. The 12 built-in works now use reviewed TMDB/IGDB IDs and provider metadata rather than a separate fixture identity system. The [machine-readable reconciliation](research/CATALOG_RECONCILIATION.json) records each alias, provider link and primary creator. Historical ML notebooks/results are preserved; the current catalog vectors were reprojected with the existing fitted transformer, not presented as a new quality benchmark.

## Catalog and persistence

- `backend/models/catalog-registry.json` is the reviewed identity registry. Existing aliases such as `dune`, `cyberpunk` and `edgerunners` resolve to provider-qualified IDs. No fuzzy title match runs at application startup.
- Initial reconciliation used exact normalized title/year and checked credits for collisions. Two distinct 2016 movies named Arrival were disambiguated by director. The reviewed Baldur's Gate III identity is retained explicitly rather than globally equating Roman and Arabic numerals. Alternate game editions were not merged automatically.
- `backend/models/catalog.json` and `apps/desktop/src/lib/catalog-data.json` hold the same provider-backed startup snapshot, with public source URLs. Local poster files remain an image-failure fallback. `tags` are provider genres; separately labeled `themes` and `editorialRelated` preserve original editorial curation.
- The existing SQLite database now has `canonical_works` and `work_aliases` tables, separate from the bounded provider-response cache. `GET /v1/catalog/builtins` exposes the canonical built-ins. The frontend refreshes that data once on startup and uses the bundled snapshot when the backend is offline. Normal title-detail requests refresh the corresponding canonical record from the provider. This is preview SQLite persistence, not a claim that hosted PostgreSQL/user sync has been deployed.
- Old routes still resolve through `canonicalWorkId`. An idempotent load migration normalizes favourites, logs, lists, featured works and claim references. It deduplicates item selections but preserves repeat log events, notes, pending-claim state, list order and Buddy provenance. Data version 1 is retained; accounts are not reset.
- Saved metadata for arbitrary provider works remains available offline. Older saved copies of built-in metadata do not overwrite the current bundled baseline. Fresh API metadata can replace it through the live registry, without introducing duplicate catalog IDs.

## Refreshing metadata and local embeddings

```sh
.venv/bin/python scripts/sync_catalog.py
```

This reads the reviewed IDs, uses the server-only provider adapters/cache/rate gates, refreshes metadata, and reprojects descriptions, genres, editorial themes and makers through the existing fitted TF-IDF/SVD transform. App and Buddy receive the same canonical ID maps and vectors, now identified as `provider-catalog-tfidf-svd-v3`. The sync updates model checksums and publishes no credentials. It requires the fitted transformer already prepared in `backend/data/buddy/`; from an earlier training bundle, run `scripts/prepare_buddy_index.py` first and then sync. The canonical database consumes the refreshed snapshot on API startup; ordinary detail reads also update its records.

The serving loader checks file digests, dimensions, finite/unit-normalized vectors, unique IDs and the catalog metadata checksum. A mismatch degrades to the labeled keyword fallback. The catalog remains bounded at 12 indexed works; canonical identity and live title browsing do not imply that the full provider catalog has been embedded.

## Creator rules

- **Games:** developing studios are primary creators. Publishers and other companies remain in expanded credits. Platform names have their own field and are no longer displayed as playtime. Unknown game duration is labeled “Playtime not verified.”
- **Movies:** directors are primary. Cast, writers and other crew are available under “Behind the work,” with provider person IDs and links where supplied.
- **TV:** use TMDB aggregate credits. Series directors take priority; otherwise directors are ordered by credited episode count. Ties use stable name ordering. Assistant, animation, sound and creative directors are not silently substituted for the primary director. If no director is supplied, a series creator may appear with the honest “Series creator” label.
- TMDB film runtime supplies verified minutes for duration filtering. Episode counts are not converted into total series duration, and raw scraped game timings are not silently assumed to be verified minutes.
- Provider person/company IDs connect title metadata, credits, creator pages and follows. Directory browsing defaults to primary studios/directors; other credited people remain discoverable through credits and live creator search.

TMDB documents [aggregate TV credits](https://developer.themoviedb.org/reference/tv-series-aggregate-credits) separately from the latest-season credits. Game company/developer fields come from the [IGDB API](https://api-docs.igdb.com/).

## Creator-page icon and membership

`CreatorIdentity.tsx` provides the shared orbit icon next to names that link to an internal creator page. It appears on work cards, title attribution, expanded credits, the sidebar, creator directory/pages and creator profiles. Known catalog credits remain usable as cached creator pages when the live provider fails, with a visible outage notice.

The orbit means **a creator page is available**, not that the person owns an account or has verified a claim. A separate fingerprint “On Distran” badge identifies an actual visible local creator-member profile. Display-name equality does not establish verified ownership; pending claims do not grant credits or badges. Private member profiles remain filtered by the existing visibility rules.

## Recommendation origin and visual language

- **For you:** neutral source label, ordinary cards, reasons tied to favourites/ratings, and a separate link to ask Buddy for a theme.
- **Editorial:** explicitly labeled spotlights and curated collections. Provider-backed metadata is separate from editorial selection.
- **Related works:** neutral source label identifying provider recommendations or editorial fallback connections.
- **Buddy:** a sparkle/text badge plus a static, low-opacity lavender border/glow on result cards. Hover/focus strengthens it slightly; the meaning does not rely on color or animation alone. Fallback results retain their request origin but explicitly state that a local fallback was used.
- **Saved Buddy lists:** `Shelf.source = "buddy"` persists through save, reload and list editing. Lists show “Started with Buddy”; shelf cards and list rows retain the subtle Buddy treatment. A work appearing in a Buddy list does not turn its ordinary catalog card into a Buddy recommendation everywhere else.

Cards keep the work link and creator link separate, avoiding nested anchors. Creators are selectable independently of opening a title. Existing friend drafts, local lists and provider-source attribution remain available.

## Verification

Unit/API checks cover ID migration, alias/canonical duplicates, preserved repeat logs and Buddy provenance, creator priority, credit IDs, verified duration rules and canonical SQLite records. Browser checks exercise ordinary versus Buddy cards, list save/edit/reload, canonical/legacy routes, creator-page icons, full credits, offline creator fallback and mobile composition. See [validation results](VALIDATION.md).
