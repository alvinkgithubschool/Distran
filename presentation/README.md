# Distran — AI unit project presentation

Two 16:9 decks for the semester AI unit project: **"Distran: adaptive
cross-media recommendations"** — training a shared-prior online classifier with
CNN and GPT-style content encoders, executed on Colab and measured on heldout data.

Presenters: **169183 Hussein** (introduction), **167602 Alvin** (methodology),
**190003 Issa** (results & conclusions). Both decks follow Introduction →
Methodology → Results & Conclusions and end with a thank-you/Q&A plus a sources
page with hyperlinks.

## Deck v2 — plain language + animated diagrams (recommended)

A 19-slide deck in the same light app theme as the app itself, borrowing the
animated-diagram layout style of the open-slide demo. Every major part of each
section comes as a pair: one slide that explains it in plain language, and one
slide with the animated diagram (rating dots landing in your profile, the
experiment timeline, the recommendation loop, the predict-then-learn update, the
TextCNN convolution window and mini-GPT next-token typing, the chronological
train/valid/test split, the results bars, and the promotion gate).

- **PowerPoint file (works on any platform):** [Distran-AI-Unit-Project-v2.pptx](./Distran-AI-Unit-Project-v2.pptx)
  — open it in PowerPoint (Windows/macOS), Keynote (macOS/iOS), LibreOffice Impress
  (Linux/Windows/macOS), or upload it to Google Slides (any OS, browser). Every slide
  carries its speaker notes in the notes pane. Note: the PPTX captures each page
  after its entrance animation has settled; the looping animations (marching lines,
  flying dots, orbiting update dot) run live on the slide page below.
- **Live slide page (any OS, any modern browser):**

  ```sh
  npm install
  npm run dev
  ```

  then open <http://localhost:5173/s/distran-ai-project-v2>. Arrow keys / PageUp /
  PageDown move between pages; `F` enters fullscreen play mode, `Esc` exits.
  `npm run build && npm run preview` serves a static production build instead.

- Source: `slides/distran-ai-project-v2/index.tsx`.

## Deck v1 — the full technical deck

A 20-slide, 16:9 deck with the progression slide (what notebooks 01–04 taught
us), the system diagram, the model formula `p(u,i,c) = σ(b + bᵤ + (θ + δᵤ)·x)`,
encoder architecture diagrams, the Colab training protocol, pre-registered
hypotheses, and the measured results tables compared against those expectations.

- **PowerPoint file (works on any platform):** [Distran-AI-Unit-Project.pptx](./Distran-AI-Unit-Project.pptx)
  — open it in PowerPoint (Windows/macOS), Keynote (macOS/iOS), LibreOffice Impress
  (Linux/Windows/macOS), or upload it to Google Slides (any OS, browser). Every slide
  carries its speaker notes in the notes pane.
- **Live slide page (any OS, any modern browser):** after `npm install && npm run dev`,
  open <http://localhost:5173/s/distran-ai-project>. Arrow keys / PageUp / PageDown
  move between pages; `F` enters fullscreen play mode, `Esc` exits.
  `npm run build && npm run preview` serves a static production build instead.
- Source: `slides/distran-ai-project/index.tsx`.

## Edit the decks

Each deck is a single slide folder, `slides/<deck-id>/index.tsx`: an array
of page components, each rendering onto a fixed **1920 × 1080** canvas with absolute
pixel values, plus a `meta` export (title) and a `notes` export (one speaker note per
page — shown in the presenter view and baked into the `.pptx` notes pages). Design
tokens (`palette`, `fonts`, `typeScale`, `radius`) are declared in the exported
`design` const at the top of the file. After editing, re-run `npm run dev` for hot
reload; to regenerate a `.pptx`, re-render each page at 1920×1080 and rebuild the
file (the current exports are committed alongside this README).
