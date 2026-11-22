# Catalog and dataset research
Checked 2026-11-07. API catalogs and downloadable open datasets are different resources. Verify credentials and applicable terms before ingestion or redistribution. No provider credentials have been provisioned.

| Source | Coverage and useful fields | Decision |
|---|---|---|
| [TMDB](https://developer.themoviedb.org/docs/getting-started) | Movies/TV, posters/backdrops, summaries, credits, production companies; movie collections; series seasons/episodes; external IDs | Primary screen catalog. Collection membership is not a universal sequel graph. Follow [attribution requirements](https://developer.themoviedb.org/docs/faq); streaming-provider attribution is separate. |
| [IGDB](https://api-docs.igdb.com/) | Games, covers/artwork, summaries, franchises/collections, related editions, involved companies/publisher roles, platforms, external IDs | Primary game catalog; Twitch application credentials server-side. Respect published limits and current schema migrations. |
| [TVmaze](https://www.tvmaze.com/api) | TV summaries/images, cast, episodes, networks and external IDs | Secondary TV source; preserve attribution/license requirements, avoid duplicate identities. |
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access) | Structured identifiers and adaptation/series/creator edges | Cross-media bridge; incomplete metadata. P144 means based on, P179 series, P136 genre, P921 main subject. None alone proves an aesthetic match. |
| [IMDb datasets](https://developer.imdb.com/non-commercial-datasets/) | Downloadable title/person/episode/crew tables and aggregated ratings | ID/credit enrichment for permitted research; not a rich poster/plot catalog or user-account logging API. |
| [Open Library](https://openlibrary.org/developers/api) | Books, editions, authors, subjects and covers | Milestone two. Descriptions and covers vary; use dumps for bulk rather than hammering search API. |
| [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) | Artists, recordings/releases, labels and work relationships | Milestone two; artwork through Cover Art Archive; no assumption of rich editorial descriptions. |

Prefer small typed adapters over unverified wrapper dependencies. Android consumes internal API DTOs using a future Retrofit/OkHttp or Ktor client; Python workers can use httpx. Wikidata JSON/SPARQL, Open Library REST and MusicBrainz REST provide documented interfaces; adapter fixtures should preserve real response schemas. No scraper is required for milestone one.

## Connections feasibility
[Letterboxd](https://letterboxd.com/api-beta/access/) is approval-gated; do not promise access for a recommendation project. A user-controlled CSV export/import can be investigated separately. IMDb's public datasets do not provide authenticated user-library sync. Steam has a [documented Web API](https://partner.steamgames.com/doc/webapi_overview); owned-game availability depends on user visibility and endpoint credentials. Backloggd (confirm intended service spelling), Xbox and PlayStation have not been verified here as offering general-purpose third-party user-library access; keep disabled and investigate official partner programs. Do not use unofficial session-cookie scraping. Spotify and Apple Music integrations are deferred; their catalog access, account authorization, artwork terms and machine-learning restrictions require separate review before implementation.

## Training sources and corrections to the initial proposal
[Amazon Reviews 2023](https://amazon-reviews-2023.github.io/) is the first cross-domain experiment: Video_Games and Movies_and_TV, joined only on identical source user IDs. Namespace items by domain and parent_asin. Measure overlap before selecting a model. Product editions, physical purchases and reviews are imperfect proxies for consuming art. A bounded prefix sample is biased: use it only for pipeline validation; use a documented deterministic sample or full category passes for research. No dataset user is a Distran user.

[MovieLens 32M](https://files.grouplens.org/datasets/movielens/ml-32m-README.html) provides ratings/tags and ID links; do not assume a tag-genome bundle is included. It is a within-movie benchmark, not cross-domain identity supervision. Do not join its numeric users to Amazon users. Steam/Goodreads can be follow-up studies after checking original release terms. Douban releases and Imhonet provenance/access have not been verified: quarantine them as optional, not required dependencies. A common dataset name does not prove shared identities across separately published domain files.

Download interaction fields only initially: user_id, parent_asin, rating, timestamp and domain. Keep license/source/date/checksum/sample policy in a manifest. Never bundle downloaded personal review text, provider images or raw identities in Git. Hash source IDs for local storage with a consistent research salt; hashing is pseudonymization, not anonymization.

## Implemented providers — 2026-11-11

TMDB and IGDB credentials have been verified and configured only in the ignored server environment. The app now uses their live search/details through the FastAPI gateway; it does not call authenticated provider endpoints from the WebView. See [catalog operations](../CATALOG_API.md). Metadata access remains separate from dataset training permission and third-party account-library connections.
