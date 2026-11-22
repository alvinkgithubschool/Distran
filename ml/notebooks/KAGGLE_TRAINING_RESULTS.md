# Kaggle metadata training, parameters and results

Completed 2026-11-16 through the installed Colab CLI on a CPU runtime. [Runnable notebook](04_kaggle_metadata.ipynb), [executed notebook with outputs](04_kaggle_metadata_output.ipynb), [full report](results/kaggle/report.json), [environment freeze](results/kaggle/environment.txt), and [execution log](results/kaggle/colab-execution.log) sit alongside this document. This extends the earlier [Amazon experiment](TRAINING_RESULTS.md); it does not replace or retrospectively improve that heldout test.

## Outcome

All three metadata-based aggregate-score predictors beat their train-mean baseline on heldout title groups. A new shared TF-IDF/SVD model supplies the app's local content vectors. These results establish aggregate-score prediction performance on these snapshots; they do **not** establish personalized recommendation accuracy, future rating forecasting, or a gain over the prior app model. No user-level preference interactions are present in these datasets.

| Task | Score scale | Test titles/rows | Selected alpha | Model MAE | Mean baseline MAE | Model RMSE | Baseline RMSE |
|---|---|---:|---:|---:|---:|---:|---:|
| Movie average vote | 0–10 | 1,928 | 1 | 0.6751 | 0.7306 | 0.8560 | 0.9085 |
| Game critic score | 0–100 | 1,591 | 1 | 9.3093 | 11.6956 | 11.8698 | 14.4630 |
| HLTB review score | 0–100 | 4,423 | 1 | 7.9080 | 8.7351 | 10.4123 | 11.4696 |

MAE is average absolute error in the target's original units; lower is better. These are single fixed group-split measurements, without confidence intervals or significance claims. The sales test count is platform rows; the split unit is normalized title, so editions of a title cannot appear on both sides.

## Sources and actual usable fields

The empty `file_path` placeholders in the supplied snippets have been resolved to the actual files below. The notebook uses `kagglehub.dataset_download` followed by explicit CSV reads, rather than relying on a guessed filename or a deprecated adapter alias. Public downloads needed no Kaggle credentials in this run. Movie version 2 and HLTB version 1 are pinned. The sales source is resolved through the Colab/Kaggle cache with an unversioned handle; its exact consumed bytes are checksummed in the report, so verify that checksum on future reruns rather than assuming “latest” is unchanged.

| Dataset | Consumed file | Raw rows | Useful fields |
|---|---|---:|---|
| [TMDB popular movies](https://www.kaggle.com/datasets/balaka18/tmdb-top-10000-popular-movies-dataset) | `movies_tmdb_popular.csv` | 10,000 | Overview, language, release date, popularity, vote average and count |
| [Video game sales with ratings](https://www.kaggle.com/datasets/rush4ratio/video-game-sales-with-ratings) | `Video_Games_Sales_as_at_22_Dec_2016.csv` | 16,719 | Genre, platform, publisher/developer, ESRB, critic/user scores and counts, release year, regional sales |
| [HowLongToBeat snapshot](https://www.kaggle.com/datasets/zaireali/howlongtobeat-games-scraper-2162025) | `hltb_data.csv` | 147,474 | Synopsis, genres, developer/publisher, platform, release dates, review score/count, completion values and counts |

Processed row counts: movies 9,998, sales 16,716, hltb 147,473.

The movie source has no canonical movie IDs, cast/crew, or per-film genre column. `genres(1).csv` is only a dictionary; there is no key connecting it to each movie. It is deliberately excluded instead of inventing genre labels. The 2016 game-sales snapshot cannot describe many of the app's newer games. HLTB supplies newer game metadata, but its aggregate profile/platform fields and zero values require care.

## Cleaning, identity and leakage controls

- Drop missing titles. Deduplicate movies by normalized title + release year; sales by normalized title + platform + year; HLTB by its game ID, keeping one stable row rather than summing repeated game-level aggregates. The observed HLTB cleanup removes one repeated ID, not thousands of presumed platform duplicates.
- Normalize Unicode/punctuation for title grouping while preserving sequel numerals. `Baldur’s Gate 3` and `Baldur's Gate 3` group together; sequels do not collapse into the base title. This is still heuristic grouping, not proof of identity.
- Parse dates/years conservatively; `0000-00-00` is unknown. Numeric score summaries coerce missing and `tbd` values to missing, not zero. Actual ranges/missingness per source column are recorded in the JSON audit. The game-sales user score is on 0–10, while critic scores are 0–100; neither is silently substituted for the other.
- Movie regression requires at least five votes. HLTB regression requires at least five game-level reviews. Targets must be finite, numeric, and inside their stated score range. No score/count fields, regional sales, review histograms or completion statistics are predictors of those same scores.
- Exact normalized title + exact release year proposes cross-source links only when the HLTB side is unique. These proposals are not canonical mapping approval. App documents are independently transformed; no external IDs are automatically merged into TMDB/IGDB identities.
- Group split: first eight SHA256 hex characters of normalized title, modulo 10; buckets 0–5 training, 6–7 validation, 8–9 test. All platform/remake variants sharing that normalized title stay together. These are snapshot group splits, **not chronological forecasts**. Title normalization can miss aliases, so residual entity leakage is still possible.
- Fit each supervised vocabulary and IDF on training rows only. Select alpha by validation MAE; evaluate test after selection and do not refit using test. The source corpora themselves are retrospective snapshots, with selection bias and possible metadata errors.

## Trained score models

Each regressor is a TF-IDF (English stop words, word unigrams+bigrams, sublinear TF, L2 normalization, `min_df=2`, at most 20,000 features) followed by Ridge regression using the LSQR solver. Validation chooses alpha from `{1, 10, 100}`. Predictions are clipped to the target scale. A train-mean constant is the reported baseline, not a learned personalized model.

| Model | Input features | Train / validation / test | Vocabulary |
|---|---|---|---:|
| movies | overview, original_lang | 5,897 / 1,872 / 1,928 | 20,000 |
| sales | Genre, Platform, Publisher, Developer, Rating | 4,886 / 1,659 / 1,591 | 3,007 |
| hltb | game_profile_summary, game_profile_genre, game_profile_dev, game_profile_pub | 13,455 / 4,475 / 4,423 | 20,000 |

Validation MAE for alpha 1 / 10 / 100:

- movies: 0.6818 / 0.6962 / 0.7307.
- sales: 8.9722 / 9.3907 / 10.2216.
- hltb: 7.8890 / 8.0552 / 8.6067.

Safe JSON exports contain vocabulary, IDF, regression coefficients, intercept, feature names and measured parameters. These regression models remain offline research tools. They do not replace real aggregate scores, manufacture a personal rating, or enter app taste ranking.

## Weighted aggregate ranking from the reference notebook

The supplied local notebook, **The Age of Recommender Systems**, was inspected without executing its old imports or hard-coded Kaggle paths. We adapt its overview TF-IDF idea and shrinkage score:

`weighted = v/(v+m) * R + m/(v+m) * C`

Here `R` is the source aggregate rating, `v` its count, `C` the mean aggregate rating among rows with nonzero counts, and `m` the 90th percentile of counts. Unrated rows remain missing. These are descriptive full-snapshot rankings, **not heldout metrics**; using the full snapshot here does not feed into supervised train/validation selection.

- movies: `C=6.456499`, `m=2596.700`, 9,802 rated rows.
- hltb: `C=62.481760`, `m=52.000`, 57,265 rated rows.

The private artifact ZIP includes `movie-weighted-ranking.csv` and `game-weighted-ranking.csv`. Completion fields are exported as source raw values with counts; they are not silently labeled hours or treated as tastes. Low-count game scores, unreleased/inconsistent records, and sparse metadata need further validation before any product use.

The reference's cast/crew join cannot be replicated with these files. Its Surprise SVD section depends on separate `ratings_small.csv` user interactions, absent here; its removed `evaluate`/`n_folds` APIs are not reused. We do not claim a collaborative model from aggregate ratings. The reference notebook's SHA256 is recorded in the new notebook's first cell; the original local download is unchanged.

## Shared content model and app integration

Fit **32,952 documents**: 9,998 movie rows, 12,954 unique game title/metadata combinations, and a deterministic SHA256-title-ordered subset of 10,000 HLTB games. This bounds game-domain dominance and memory use. HLTB sample selection is unsupervised and does not consult score targets.

Content inputs use titles, movie overviews/languages, and game summaries/genres/developers/publishers. Scores, vote counts and sales are excluded from semantic text. TF-IDF uses at most 30,000 unigram/bigram features, English stop words, `min_df=2`, sublinear TF, then truncated SVD with 64 components, five iterations and seed 42. These snapshot corpora are fit as an unsupervised index; content probes are transductive diagnostics, not a heldout relevance evaluation.

Explained variance: **0.105917**, which is not recommendation accuracy. All **12** curated app works have finite, nonzero projected vectors. TV works can be projected from the app's own descriptions, but none of these datasets constitutes a TV training benchmark.

The downloaded `catalog-model.json` replaces the earlier 8-dimensional artifact at `apps/desktop/src/lib/catalog-model.json`, using model ID `kaggle-catalog-tfidf-svd-v2`. It contains only the app's 12 curated work IDs and projected vectors. Training on more metadata **does not add thousands of external titles to the app**; live-provider indexing remains a separate task. The original v1 model remains in `ml/artifacts/remote/` for rollback, and its historical provenance file refers to the artifact paths at the time of that run.

Home → For you → Your next connection continues to run locally through `recommendations.ts`: favourite/high-rating profile, separate dislike centroid, all-seen exclusion, format filters, MMR and curated fallback. No history is sent to Kaggle or an inference server. The model is a preview with no labeled relevance study, so there is no claim that these vectors rank better than v1. Some high cosine matches are broad or weak and require human evaluation.

Example raw content probes (before profile weighting, exclusions and MMR):

- `cyberpunk` → `edgerunners` (0.866), `disco-elysium` (0.853), `elden-ring` (0.639).
- `outer-wilds` → `dune` (0.685), `arrival` (0.633), `elden-ring` (0.578).
- `blade-runner` → `cyberpunk` (0.540), `edgerunners` (0.534), `disco-elysium` (0.517).

Exact title/year proposals: 6,597 sales–HLTB title/year pairs, and 9 of 12 app works with one candidate. None is automatically approved. Dune: Part Two is missing from this older movie snapshot; the two TV works are outside its scope.

## Reproduction, artifacts and hosting

```sh
colab new -s distran-metadata-20261116
colab exec -s distran-metadata-20261116 -f ml/notebooks/04_kaggle_metadata.ipynb --timeout 1800
colab download -s distran-metadata-20261116 /content/distran-metadata/results.zip ml/artifacts/kaggle-results.zip
# Extract into ml/artifacts/kaggle-remote and review report.json before copying the app model.
colab stop -s distran-metadata-20261116
```

Pins, verified against versions imported by the final run: NumPy 2.2.6, pandas 2.2.3, scikit-learn 1.6.1, kagglehub 0.4.3. The notebook launches training in a fresh Python subprocess after installation so cached inspection imports cannot bypass those pins. A provisional run was discarded after identifying that issue; the final pinned run reproduced the reported scores exactly. Full runtime freeze and input SHA256 values are retained. The notebook embeds the precise experiment source and app text snapshot. Edit `ml/metadata_experiment.py` for future runs and regenerate that snapshot; do not silently alter an already measured notebook. The current run excludes confidence estimation; pre-register further tuning and use a fresh test split if optimizing based on these test results.

Private local artifacts live in the ignored `ml/artifacts/kaggle-remote/`: three score regressors, full content vocabulary and IDF/SVD arrays, aggregate ranking tables, app vectors, report and freeze. The ZIP and per-file hashes are recorded separately in provenance. Raw Kaggle data remains on the released Colab runtime/cache, not in the repository; only aggregated audit/results and the 12-item app model are included here. Dataset listing access does not settle underlying TMDB/HLTB redistribution rights; this is a research run, with source data/derived external rankings kept out of the app bundle and submission.

No new hosting is needed for the projected app model. The full 30,000-feature/64-component transformer is an offline artifact, while local app inference uses only 12 small vectors. To serve the larger external catalog later, add canonical ID mapping and metadata/rights review, then extend the existing FastAPI service with a versioned CPU retrieval index, authenticated profile handling and the PostgreSQL catalog. Validate relevance, coverage and latency before enabling that path. No extra GPU service, deployed endpoint or Buddy language model was provisioned.

## Verification

- All four notebook code cells completed with saved outputs. CLI 0.7.5 leaves execution counters null; the log records each cell. Training versions were verified from the child process, not inferred from `pip freeze` alone.
- 10 ML tests passed in an isolated local environment with matching NumPy/pandas/scikit-learn pins, covering temporal metrics plus title grouping, sequels, zero-count scores, shrinkage, platform deduplication and ambiguous identity proposals.
- 18 frontend unit tests passed with the new vectors. TypeScript/Vite build passed.
- Playwright's focused recommendation flow passed with the catalog API blocked, covering format filtering, exhausted films, reload persistence and desktop/mobile rendering.
- All 12 app vectors are finite, unit-normalized and 64-dimensional. Input/model/notebook hashes are preserved in [provenance.json](results/kaggle/provenance.json).
- Artifacts downloaded before runtime release. No hosted service, native bundle or Buddy chat was deployed.
