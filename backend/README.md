# Distran catalog backend

Read-only FastAPI gateway for TMDB movies/TV and IGDB games. Credentials are loaded only by Python from `backend/.env`; the Tauri/React client receives normalized public metadata.

## Setup

From the repository root:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.lock.txt
cp .env.example backend/.env
# Fill TMDB_READ_TOKEN, TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET privately.
pnpm api
```

The supplied credentials have already been configured locally in `backend/.env`; do not overwrite that file when using this checkout. It is git-ignored and has mode 0600. No API key/token is committed to examples or exposed through feature flags. TMDB uses the read-access bearer token, so its alternative v3 API key is not required. Twitch exchanges the IGDB client credentials for a temporary app access token on the server.

API: <http://127.0.0.1:8000>. Interactive contract: <http://127.0.0.1:8000/docs>. The launcher listens on loopback and runs one worker. Python 3.13 was used for the checked lockfile; other supported Python/platform combinations may need to resolve their own environment from `requirements.txt`.

Run the frontend in a second terminal with `pnpm dev`, or open Tauri with `pnpm app`. Public `VITE_CATALOG_API_URL=http://127.0.0.1:8000/v1` is already set for development/demo builds; it contains no secret. The backend must remain running for new provider requests. A native bundle does not embed or launch the Python service.

## Verification

```sh
pnpm test:api
pnpm test
pnpm test:e2e
```

Backend unit/integration tests mock provider HTTP traffic and consume no live quota. The UI suite also mocks or aborts provider-gateway traffic. Live credentials were checked separately against movie, TV and game search/details; see `docs/VALIDATION.md` for measured results.

Detailed endpoint contracts, cache policy, limits and deployment boundaries: [Catalog API guide](../docs/CATALOG_API.md).

Creator directory reads are also available at `/v1/creators/search?q=Nolan` and `/v1/creators/tmdb:person:525`. They share the catalog pool, provider limits, persistent cache and credentials. See [creator contracts](../docs/CREATOR_PROFILES.md). Claim requests remain in local app storage; there is no public claim-approval endpoint.

## Buddy free-model preview

Buddy now supports thematic list ranking and single-turn conversation through the two approved OpenRouter free models. The key stays in the ignored, owner-only backend environment. Prepare the local content index with `.venv/bin/python scripts/prepare_buddy_index.py`, verify routing with `.venv/bin/python scripts/check_models.py`, and restart the API. See [routing, setup, scripts and limits](../docs/BUDDY_RECOMMENDATIONS.md). No paid fallback is configured.
