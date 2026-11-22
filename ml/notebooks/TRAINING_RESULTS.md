> Follow-up: [Kaggle metadata training](KAGGLE_TRAINING_RESULTS.md) now supplies the app’s v2 content vectors. This document and Notebook 03 preserve the earlier Amazon/v1 run; their measured results and historical artifact hashes are unchanged.

# Distran training process, results and app configuration

Run date: 2026-11-16. Execution: **Google Colab CPU through the installed `colab` CLI**. Notebook: [03_training.ipynb](03_training.ipynb); executed copy: [03_training_output.ipynb](03_training_output.ipynb). The notebook embeds its training code and curated catalog snapshot; it does not require a checkout or secret provider credentials.

## Data and preprocessing

The official [Amazon Reviews 2023 5-core ratings-only release](https://amazon-reviews-2023.github.io/data_processing/5core.html) provides `Video_Games` and `Movies_and_TV`. Both compressed CSV files are scanned completely. Every user is selected using the first eight SHA256 bytes interpreted big-endian, modulo 128 equal to zero. The same rule applies across domains, preserving source identity overlap without selecting users using future positive events. This is a deterministic user sample, not a prefix sample. Actual compressed-byte checksums, row counts and overlap appear in the result JSON.

Only user ID, parent ASIN, 1–5 rating and timestamp are consumed. No review text, demographics or artwork is used. IDs are pseudonymized in memory with a consistent random per-run salt. Items are namespaced `game:` and `screen:`. Ratings must be finite and within range; timestamps are integer Unix milliseconds. Duplicate `(user, item, timestamp)` events retain the last observed record. The salt is not exported: sampled source users are reproducible but their pseudonyms differ across runs. User factors and maps are private artifacts; no source user identifiers are printed in the notebook. The per-run salt also changes sorted pseudonym order and therefore SGD ordering: cohort selection is reproducible, but a new runtime is not guaranteed to regenerate identical factor bytes or scores. Preserve the downloaded factors as the measured run; a follow-up study should retain a private fixed salt or deterministic internal user order for exact reruns.

The publisher selected its 5-core population using full histories. Consequently, this remains a retrospective benchmark on a preselected population, despite leakage controls in our split. Physical purchases, editions, hardware and reviews are imperfect proxies for preferences about works. `Movies_and_TV` cannot reliably be separated into film and series without metadata. Results do not establish TV-only quality, general-population quality, app-user quality, or social recommendation quality.

## Training and evaluation

Events are split at global 60%/80% boundaries in the ordered distinct timestamp set. The actual resulting event counts are reported below. User and item maps, popularity counts and factors are fit only on training events. Ratings >=4 are positive. BPR uses 16 factors, 30 epochs, learning rate 0.03, regularization 0.01 and seed 42. Its negative sampling is uniform over the complement of training positives; this does not establish those samples are dislikes. Explicit low ratings are never converted to positive events.

Compare train-positive popularity, BPR, and a hybrid. Each collaborative score row and the popularity vector are converted into tie-preserving empirical percentiles. Choose the collaborative weight from `{0, .25, .5, .75, 1}` by validation NDCG@10 only; ties prefer less collaborative weight. Freeze that selection before test evaluation. Every reported baseline uses the same eligible cohort. Rank the **entire training catalog**, excluding all training-seen works, with separate game/screen candidate restrictions for domain metrics. Recall/NDCG are macro user averages. Cold held-out items and repeated items are excluded from attainable recall and counted separately; do not interpret conditional warm scores as whole-population scores. Unseen users receive no learned collaborative evaluation.

Intervals are percentile 95% intervals from 400 user bootstrap resamples with seed 42. They describe this cohort, not paired significance or multiple-experiment correction. Catalog coverage is the fraction of train-domain items recommended at least once.

`game_to_screen` and `screen_to_game` warm metrics require at least one positive training event in the source domain and a novel attainable positive in the target holdout. These users can also have target-domain training events. The separate **source-only fold-in** averages learned source-item factors into a profile and scores target factors without target events in the profile. Shared item factors still use the whole training population; this is not an unseen-user or strict zero-shot test.

## Measured results

Completed on Colab CPU in **253.2 seconds** for preprocessing, training, evaluation and content fitting (excluding CLI/runtime setup). Full-source identity overlap: **19,615 users**. Sample: **65,999 events**; training/validation/test: **39,600 / 13,204 / 13,195**. Training maps contain **4,718 users and 24,390 items**.

- `train_max`: 1469599661000 (2016-07-27T06:07:41+00:00).
- `validation_max`: 1531489567129 (2018-07-13T13:46:07.129000+00:00).

Validation overall (1,379 eligible users):

| Collaborative weight | Recall@10 | NDCG@10 |
|---|---:|---:|
| 0 | 0.027582 | 0.018446 |
| 0.25 | 0.025237 | 0.013980 |
| 0.5 | 0.023962 | 0.012891 |
| 0.75 | 0.023255 | 0.012149 |
| 1 | 0.018246 | 0.010540 |

**Selection: collaborative weight 0.0**, so the selected hybrid is exactly popularity. No test-driven retuning was performed.

Test scores (warm/attainable cohorts):

| Model | Cohort | Eligible users | Recall@10 | NDCG@10 | Catalog coverage |
|---|---|---:|---:|---:|---:|
| popularity | all | 303 | 0.000000 | 0.000000 | 0.0492% |
| popularity | game | 24 | 0.020833 | 0.016119 | 0.4719% |
| popularity | screen | 282 | 0.000000 | 0.000000 | 0.0544% |
| popularity | game_to_screen | 17 | 0.000000 | 0.000000 | 0.0453% |
| popularity | screen_to_game | 7 | 0.000000 | 0.000000 | 0.4290% |
| bpr | all | 303 | 0.000000 | 0.000000 | 2.0459% |
| bpr | game | 24 | 0.000000 | 0.000000 | 7.5504% |
| bpr | screen | 282 | 0.000000 | 0.000000 | 2.1624% |
| bpr | game_to_screen | 17 | 0.000000 | 0.000000 | 0.5123% |
| bpr | screen_to_game | 7 | 0.000000 | 0.000000 | 2.7885% |
| hybrid | all | 303 | 0.000000 | 0.000000 | 0.0492% |
| hybrid | game | 24 | 0.020833 | 0.016119 | 0.4719% |
| hybrid | screen | 282 | 0.000000 | 0.000000 | 0.0544% |
| hybrid | game_to_screen | 17 | 0.000000 | 0.000000 | 0.0453% |
| hybrid | screen_to_game | 7 | 0.000000 | 0.000000 | 0.4290% |

Source-only factor fold-in:

| Direction | Eligible users | Recall@10 | NDCG@10 |
|---|---:|---:|---:|
| game_to_screen | 17 | 0.000000 | 0.000000 |
| screen_to_game | 7 | 0.000000 | 0.000000 |

Test has 5,567 positive held-out users, but only 303 are eligible for the conditional warm evaluation. There are 8,718 distinct per-user positive held-out item pairs absent from the training catalog and 0 training-seen positive repeats. Reported scores therefore cannot be read as coverage of all holdout users.

**Finding:** BPR did not beat popularity on validation, and both have zero overall test Recall@10/NDCG@10. This is a failed promotion experiment, not a successful trained production recommender. The cross-domain test cohorts are very small (17 and 7); zero-hit bootstrap intervals do not establish that the true population rate is zero. The selected model should remain research-only. Future work should increase overlap/density, investigate chronological cohort shift and reviewed product-to-work mappings, pre-register changes using validation, and use a fresh heldout period rather than repeatedly optimizing this test.

All metric confidence intervals, exclusions, exact input-byte checksums and environment details are in [results/report.json](results/report.json) and [results/environment.txt](results/environment.txt).

The independent app content model fit **12 curated works**, **433 TF-IDF features**, **8 SVD dimensions**. SVD explained variance: **0.6712** (not relevance accuracy). Raw cosine probe: Cyberpunk 2077 → Cyberpunk: Edgerunners, Outer Wilds, Blade Runner 2049, Disco Elysium. Some links are weak, underlining the preview limitation; the app applies profile weighting, exclusions and MMR after these vectors.

## App model and configuration

The app runs a **separate TF-IDF + truncated SVD content model** fit on its curated catalog, not on Amazon product identifiers. Fields: title, description, tags and maker. The notebook fits English-unigram/bigram TF-IDF (maximum 4,096 features), eight SVD dimensions, seed 42, and unit-normalizes item vectors. It exports JSON vectors plus a safe JSON vocabulary/IDF/components transformer; no pickle or remote executable model is loaded.

The exported `catalog-model.json` is copied into `apps/desktop/src/lib/catalog-model.json`. `recommendations.ts` validates schema, finite dimensions and known IDs, builds separate positive and negative centroids locally, weights ordered favourites and high ratings, subtracts dislike affinity, excludes favourites and **all logged works**, and reranks using MMR (0.85 relevance, 0.15 redundancy). Repeated logs contribute one latest signal per work. Unknown live provider IDs supply no signal until they have indexed metadata. Empty, unsupported or incompatible profiles use curated fallback. A format filter is applied before ranking. Fallback is editorial order, not measured popularity.

Home → For you → **Your next connection** shows these recommendations and thematic explanations. App history stays on the device. This small content model is a functional preview, not a claim of validated recommendation quality. No held-out relevance labels exist for the curated catalog. Its inference examples are sanity checks; SVD explained variance is not recommendation accuracy. Buddy chat stays disabled because no chat model or tools have been integrated.

To reproduce after edits:

```sh
colab new -s distran-training-20261116
colab exec -s distran-training-20261116 -f ml/notebooks/03_training.ipynb --timeout 2400
colab download -s distran-training-20261116 /content/distran/results.zip ml/artifacts/colab-results.zip
# Extract into ml/artifacts/remote; copy catalog-model.json into the app lib directory.
# Keep bpr-factors.npz private. Copy only report.json/environment.txt to notebooks/results.
colab stop -s distran-training-20261116
pnpm test
pnpm build
```

Regenerate the notebook's embedded source/catalog after editing `ml/experiment.py`; the notebook is an immutable snapshot of the measured run. Dependency pins are NumPy 2.2.6 and scikit-learn 1.6.1; the downloaded environment freeze captures transitive/runtime versions. The private results ZIP contains the report, factor maps, content model, transformer and environment freeze. `ml/artifacts/` and raw data are git-ignored. Only aggregated report, environment, execution log and notebook belong with the submission.

## Backend and hosting plan

**No extra hosting is necessary for the implemented model.** The small content index ships with the React/Tauri app and has no inference network dependency, API key, GPU or additional monthly service. The existing FastAPI catalog gateway continues to handle live catalog reads. Updating the bundled index requires a rebuild; new live works are not silently represented as indexed.

A later production collaborative rollout needs reviewed Amazon-parent-ASIN → canonical app-work mappings, metadata rights, useful measured coverage and held-out improvement against the relevant baseline. Do not join Amazon users to Distran accounts. New app accounts should use consented app history to form profiles or train app-specific factors. Keep benchmark factors in research storage until those gates pass.

For that rollout, extend the existing FastAPI service with an authenticated `POST /v1/recommendations`: derive account identity from verified tokens; apply visibility/exclusions on every request; read canonical works from managed PostgreSQL; load a versioned, checksummed model from private object storage at startup; use CPU inference and retain a previous artifact for rollback. A worker can refresh catalog features and periodically retrain from consented events. Separate ingestion/training from HTTP workers. Use TLS and an exact client-origin allowlist, per-account rate limits, bounded inference queues, health/readiness checks, latency/error metrics and a diverse fallback. Never serve through an ephemeral Colab runtime.

Start with one CPU API instance and the existing relational store, then measure memory and p95 latency using the mapped index before choosing instance size. No GPU or separate vector service is justified by this preview. Add pgvector only when catalog size and measured retrieval latency require indexed search. Deployment needs a selected hosting account, region, database and private artifact bucket; none were provisioned or charged by this task. Hosted client API URLs and Tauri CSP origins must be configured together. Buddy would additionally need a separately chosen language model and allowlisted internal tools, with its own evaluation; the recommendation model is not a conversational model.

## Verification and remaining limits

- Completed Colab notebook: all four code cells executed successfully, with saved outputs; private ZIP downloaded before terminating the runtime. CLI 0.7.5 saves output cells with null execution counters; the retained execution log records all four cell executions. Counters were not fabricated.
- ML checks: 7 passed (`python3 -m unittest discover -s ml/tests -v`). Local system Python had NumPy; the backend virtual environment did not, so ML checks used system Python. Reported experiment metrics come from the pinned Colab environment.
- Sampling optimization: fixed regression fixture produced bit-identical factors with list and cached-array complements.
- Backend regression checks: 10 passed (`.venv/bin/python -m unittest discover -s backend/tests -v`).
- Frontend unit checks: 18 passed (`pnpm test`), including cold fallback, unknown IDs, exclusions/dislikes, format constraints, repeat-log handling and deterministic bounded output.
- TypeScript and Vite build passed (`pnpm build`).
- Focused Playwright flow passed: recommendations render with catalog API blocked, exhausted film collection shows an empty state, series filtering works, and results survive reload. Desktop (1440 px) and mobile (390 px) screenshots were captured in `apps/desktop/test-results/`.
- No production deployment, native bundle rebuild, hosted collaborative inference or chat integration was performed.

A full dual-tower/ALS/graph/social model, item matching precision audit, multilingual encoder, independent cold-user study and production promotion remain future experiments. This run implements and measures the bounded BPR/popularity/hybrid baseline and a working app content path; it does not label those future techniques as trained.

Dataset citation: Hou et al. (2024), *Bridging Language and Items for Retrieval and Recommendation*, arXiv:2403.03952. Source/terms must be reviewed again before commercial use or redistribution. This document and the notebook publish no raw ratings or private user map.
