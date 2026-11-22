> Development follow-up: see [the scaffold README](README.md), [verified source research](docs/research/SOURCES.md), and [training mathematics](ml/README.md). The original proposal below contains unverified dataset assumptions; the research document records corrections and deferred sources.

 # Distran Cross-Media Recommendation Engine: Selected Datasets & Strategy

This document outlines the recommended datasets and architectural approach for building a multi-format, user-sourced recommendation algorithm for **Distran** (covering games, films, series, books, comics, podcasts, and music).

---

## 1. Selected Datasets

### A. Overlapping User Datasets (Collaborative Filtering & Transfer Learning)

To learn how taste in one format transfers to another (e.g., how logging an immersive RPG predicts preferences in sci-fi novels or synthwave albums), we select multi-domain datasets where user identities persist across domains:

| Dataset | Media Formats Covered | Signal / Interaction Types | Best Used For |
|---|---|---|---|
| **Amazon Reviews (McAuley Lab, 2023)** | Video Games, Movies & TV, Books, Comics, CDs & Vinyl | User IDs, 1–5 star ratings, text reviews, timestamps, verified purchases | Cross-domain collaborative filtering backbone (e.g., RecBole-CDR / DTCDR architectures). |
| **Douban Multi-Domain Dataset** | Movies, Books, Music | User IDs, ratings, tags, social network graph | Pre-training cross-media transfer models and user latent representation mapping. |
| **Imhonet Dataset** | Games, Movies, Books | User IDs, numerical ratings, written reviews | Evaluating cross-format ranking accuracy between games and screen/print media. |

---

### B. High-Density Domain-Specific Datasets (Format Encoders)

For specialized representation learning within individual formats before projecting into a unified embedding space:

- **Video Games:** *Steam Reviews & Playtime Dataset* (UCSD / McAuley) — playtime metrics, player review vectors, and granular tag-based community classification.
- **Movies & Series:** *MovieLens 32M* — fine-grained 0.5–5 star ratings, timestamps, and tag genome vectors.
- **Books & Graphic Novels:** *Goodreads / UCSD Book Graph* — genre categorization, shelving behavior (`read`, `to-read`), and textual review sentiments.
- **Music & Soundtracks:** *Last.fm LFM-1b Dataset* — listening frequency, artist affinity, and community genre tags.

---

### C. Aesthetic & Franchise Knowledge Graphs (Cold-Start & Cross-Format Links)

Distran centers heavily on universe continuity (e.g., the *Cyberpunk 2077* franchise spanning games, anime, tabletop systems, comics, and albums) and aesthetic atmospheres (*corridor*, *sodium*, *neon*, *skyline*).

- **Wikidata Entity Graph:** Maps semantic relationships across formats using entity properties:
  - `P144` (based on / adaptation)
  - `P179` (part of series / shared universe)
  - `P921` (main subject / theme)
  - `P136` (genre / subgenre)
- **TMDB & IGDB Metadata:** Dense plot summaries, stylistic keyword tags, franchise identifiers, and creator linkages.

---

## 2. Recommendation Architecture for Distran

```
                                +---------------------------+
                                |  User Interaction Stream  |
                                | (Logs, Lists, Waitlists)  |
                                +-------------+-------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
         [Cross-Domain CF Model]                           [Multimodal Semantic Space]
       (Amazon 2023 + Douban Graph)                       (Wikidata + Text Embeddings)
                     |                                                 |
     Maps user taste vectors across formats             Resolves shared universe / aesthetic
        (e.g., Game -> Novel -> Music)                  links (e.g., Cyberpunk / Dune / Exit 8)
                     |                                                 |
                     +------------------------+------------------------+
                                              |
                                              v
                                  +-----------------------+
                                  |   Hybrid Ranker &     |
                                  |   Buddy Filter        |
                                  +-----------+-----------+
                                              |
                                              v
                              +-------------------------------+
                              |    Distran Surfaces:          |
                              | - Buddy Conversational Picks  |
                              | - Lane Shelves (/home)        |
                              | - HitList Discovery           |
                              +-------------------------------+
```

---

## 3. Recommended Phased Implementation

1. **Phase 1: Cold-Start Semantic Graph (Zero User Data Required)**
   - Ingest catalog entries and build a vector index (e.g., using `text-embedding-3-small` or `bge-m3`) across `title`, `description`, `logline`, `tags`, and `motif`.
   - Traverse Wikidata triples (`P144`, `P179`) to hard-link franchise extensions.

2. **Phase 2: Offline Cross-Domain Representation Pre-Training**
   - Extract user subsets from the Amazon 2023 dataset who interacted with both `Video_Games` and `Movies_and_TV` or `Books`.
   - Train a dual-target or multi-domain collaborative filtering model (e.g., RecBole-CDR) to learn projection matrices across format embeddings.

3. **Phase 3: Real-Time Buddy & Ledger Integration**
   - Combine the user's explicit logs, Top 5 picks, and waitlists into a weighted user profile vector.
   - Use cross-domain projection to retrieve top-k candidate items in complementary lanes (e.g., recommending a dark ambient synth album after a user logs a high-rating cyberpunk game).
