> The active app/Buddy index is now `provider-catalog-tfidf-svd-v3`, reprojected after reconciling built-ins with live provider metadata. Historical Kaggle/Amazon experiment files remain unchanged. See [catalog reconciliation](../docs/CATALOG_RECONCILIATION.md).

# Adaptive personalization follow-up (05)

[Notebook 05](notebooks/05_adaptive_personalization.ipynb) executes the Phase C proposal from [ADAPTIVE_PERSONALIZATION_RESEARCH.md](notebooks/ADAPTIVE_PERSONALIZATION_RESEARCH.md): TextCNN and mini-GPT content encoders on the pinned Kaggle corpus plus the shared-prior online logistic preference classifier (`distran-apc-v1`) on the sampled Amazon 5-core interactions. See [measured results, model classification and limitations](notebooks/ADAPTIVE_PERSONALIZATION_RESULTS.md). Research artifacts only; nothing is promoted to the app.

# Kaggle metadata follow-up

[Notebook 04](notebooks/04_kaggle_metadata.ipynb) trains and evaluates three aggregate-score regressors and the shared content model using the three supplied Kaggle sources. See [parameters, scores, limitations and app configuration](notebooks/KAGGLE_TRAINING_RESULTS.md). The app now bundles the v2 content vectors; the earlier Amazon and 12-document v1 run remain preserved below. Run all ML checks with the isolated environment: `ml/artifacts/test-env/bin/python -m unittest discover -s ml/tests -v` (requires NumPy, pandas and scikit-learn).

# Completed training and app model

See [the Colab training notebook](notebooks/03_training.ipynb) and [process, measured results, app configuration and hosting plan](notebooks/TRAINING_RESULTS.md). The app uses the separate bundled content model; Amazon collaborative factors remain research artifacts until canonical work mapping and promotion.

# Recommendation training and mathematics

The goal is a personal path through works, with explainable links and deliberate discovery. A classifier alone does not solve this: ranking scores candidate items relative to a user/context; calibration can estimate action probability later. Buddy's chat model explains and uses tools; it is not the recommendation model.

## Run and reproduce
Open `notebooks/01_baseline_smoke.ipynb` in Colab and run all cells on CPU. It embeds the executable NumPy module and writes demo factors plus manifest. Notebook 02 audits two uploaded Amazon JSONL samples and requires no remote-code dataset loader. No GPU is needed yet. Local check: `python3 -m unittest discover -s ml/tests`. NumPy is the sole local experiment dependency; record its exact version in every run. Pin the environment for reportable experiments, rather than relying on Colab's changing defaults.

The installed `colab` CLI can run Python scripts on remote runtimes. Inspect `colab run --help` and `colab upload --help` before a remote run. The scaffold has been checked locally; no remote session or completed real-data training is implied. Download artifacts before releasing ephemeral runtimes. Keep raw data in private Drive storage or runtime scratch, not Git; persist manifest, metrics and model separately.

## 1. Signals and cold start
Represent a work by normalized text embedding e_i = E(title, description, genres, themes, credits) / ||E(...)||. A first implementation can use TF-IDF plus truncated SVD as an inexpensive baseline; evaluate a multilingual sentence encoder separately. Fit vocabulary/SVD on training catalog snapshots only. Provider posters are for display, not automatically licensed visual-training data.

User profile p_u = normalize(sum_i w_ui exp(-ln(2) Δt_i / h) e_i). The half-life h is validated. Ordered favorites, ratings, saves and completion have different weights; a planned work is weaker evidence than a favorite. Low ratings/hides should suppress candidates explicitly. Average only positive preference evidence into a positive centroid; maintain a separate negative centroid. Empty profile falls back to editorial/diverse popularity. Keep exploration and explicit medium filters user-controllable.

Cosine similarity is p_u^T e_i. Add graph evidence from adaptation, series and creator edges with provenance. Similar themes are hypotheses, not verified adaptations. Separate evidence explanations: 'same creator', 'adaptation', 'similar atmosphere'. Avoid presenting an inferred connection as fact.

## 2. Collaborative baseline: BPR
Let U_u and V_i be d-dimensional learned factors and s(u,i)=U_u^T V_i. For positive i and sampled unobserved j:

L = -sum_(u,i,j) log sigmoid(s(u,i)-s(u,j)) + λ(||U||² + ||V||²).

The provided NumPy implementation uses rating >= 4 as positive, dimension 16, seed 42 and SGD. For a pair, g=1-sigmoid(U_u^T(V_i-V_j)); updates use old vectors: U += η[g(V_i-V_j)-λU], V_i += η[gU-λV_i], V_j += η[-gU-λV_j]. An unobserved item is not a proven dislike. Sampling changes the learned task; balance domains and report sampling policy. The small implementation precomputes complements and is unsuitable for full Amazon scale. Replace with bounded rejection or alias sampling for large experiments.

An alternative implicit ALS objective is sum_ui c_ui(p_ui-U_u^T V_i)² + λ(||U||²+||V||²), where p_ui indicates a positive event and c_ui=1+α log(1+n_ui). Explicit low ratings should not be converted into positive implicit events. Compare ALS/BPR against popularity before increasing complexity.

## 3. Cross-domain learning
A shared source user can have domain-specific factors p_u^g and p_u^m. Learn a regularized mapping W minimizing sum_overlap ||W p_u^g - p_u^m||² + λ||W||_F²; solve ridge regression on TRAIN overlap only. This transfers a population signal, not a guaranteed personal preference. Compare against shared-user BPR. Domain-specific towers can later learn q_i^d = f_d(features_i), with shared user representation and pairwise loss. Only add contrastive InfoNCE alignment when there are verified positive cross-domain item pairs: -log exp(sim(z_a,z_b)/τ) / sum_k exp(sim(z_a,z_k)/τ). Exclude other verified positives from negatives. Identity equality across independent datasets is never evidence of the same person.

## 4. Hybrid ranking and a unique path
Retrieve candidates independently from semantic similarity, collaborative scores, graph neighbors and later consented friend activity. Normalize scores using validation distributions before mixing:

S(u,i)=a C(u,i)+b T(u,i)+c G(u,i)+d F(u,i)+e N(i)-penalties(u,i).

C is collaborative, T semantic taste, G graph evidence, F visible friend affinity and N freshness/novelty. Coefficients are validation-tuned; disable absent signals and reweight. Friend activity requires visibility checks at serving time, decay and caps per friend. Avoid letting one prolific friend dominate.

Diversify greedily with maximal marginal relevance: MMR(i)=ρ S(u,i)-(1-ρ) max_(j selected) cos(e_i,e_j). Maintain format quotas when users request a cross-media path; respect exclusions, spoilers, region and availability. Novelty may use -log P(i) from train popularity. Exploration can start as a small randomized slot with logged propensities; contextual bandits require enough exposure data and an ethical evaluation plan. A taste path is an ordered set of explained transitions, not simply a nearest-neighbor list.

## 5. Evaluation protocol
Deduplicate exact interaction events; retain valid repeat logging where meaningful. Use global chronological cutoffs so future events from other users cannot influence earlier predictions. Train-only user/item maps. Freeze training, tune on validation, evaluate test once. Repeated item interactions can inflate results: exclude all training-seen items and report repeat consumption separately. The smoke implementation does this filtering but does not implement every protocol below.

Recall@K = |recommended ∩ relevant| / |relevant|. DCG@K = sum_r rel_r/log2(r+1) for one-based ranks, NDCG = DCG/idealDCG. Report macro averages and eligible cohort counts; zero eligible users produces null, not a fake zero score. Full train-catalog ranking is preferable; sampled-negative metrics must disclose sampling and cannot be compared directly with full-catalog results.

Report game→movie, movie→game and TV separately, warm users, cold users, cold items and users with no training overlap. Include training-catalog coverage, heldout exclusion counts, novelty, intra-list diversity and cross-format share. Bootstrap confidence intervals by user. Compare popularity, semantic-only, BPR, hybrid, then ablate graph and friend signals. Social gains cannot be claimed from Amazon alone. Evaluate metadata matching precision manually on a small labeled set. Avoid importing test ratings/review text or future metadata into embeddings.

Promotion requires improvement against relevant baselines, acceptable latency, meaningful catalog coverage, and no privacy/filter regressions. Thresholds are to be set after measurements. The synthetic smoke metrics are pipeline checks only; no quality claim or production switching is implemented yet.

## 6. Experiment artifacts and model routing
Every real run records data source/terms, sample design, consumed bytes SHA256, time cutoffs, dedup policy, overlap counts, seed, environment lock, hyperparameters, metrics/cohorts, identity maps and factor dimensions. Store user maps privately; never publish raw source user IDs. A production manifest must additionally link the canonical catalog mapping and feature schema. Do not load untrusted pickle models. See `docs/ARCHITECTURE.md` for routing, staging and rollback.

Further techniques are planned, not implemented: sentence embeddings/ANN, graph scoring, ridge transfer, ALS, MMR and the learned hybrid. The executable baseline currently implements BPR, temporal splitting and Recall/NDCG only.

References: [BPR paper](https://arxiv.org/abs/1205.2618), [implicit feedback factorization](https://ieeexplore.ieee.org/document/4781121), [Amazon 2023](https://amazon-reviews-2023.github.io/), [MovieLens README](https://files.grouplens.org/datasets/movielens/ml-32m-README.html).

A bounded real-data training entry point is available: `python3 ml/train.py events.jsonl ml/artifacts/run-001`. Input is normalized JSONL with pseudonymized `user_id`, namespaced `item_id`, numeric `rating` (Amazon 1–5) and integer `timestamp`. Use one consistent timestamp unit. The script deduplicates events, splits globally, trains BPR and exports factors/metrics. It deliberately refuses more than 100,000 lines; this implementation is for small experiments. Do not use the audit's biased prefix for a quality claim. The script evaluates both validation and test for a fixed baseline; when tuning, defer reading test until model selection is complete.
# Adaptive personalisation research

[Research and proposed implementation](notebooks/ADAPTIVE_PERSONALIZATION_RESEARCH.md) covers combining the current content model, Buddy relevance and future collaborative signals with a regularised, changing per-user preference classifier. No new model is trained or promoted by that report.

