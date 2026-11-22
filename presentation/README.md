# Distran — AI unit project presentation

A 20-slide, 16:9 deck for the semester AI unit project: **"Distran: adaptive
cross-media recommendations"** — training a shared-prior online classifier with
CNN and GPT-style content encoders, executed on Colab and measured on heldout data.

Presenters: **169183 Hussein** (introduction), **167602 Alvin** (methodology),
**190003 Issa** (results & conclusions). Structure: Introduction → Methodology →
Results & Conclusions, with a progression slide (what notebooks 01–04 taught us),
the system diagram, the model formula
`p(u,i,c) = σ(b + bᵤ + (θ + δᵤ)·x)`, encoder architecture diagrams, the Colab
training protocol, pre-registered hypotheses, the measured results tables
compared against those expectations, and a closing thank-you/Q&A plus a sources
page with hyperlinks.

## View the deck

- **PowerPoint file (works on any platform):** [Distran-AI-Unit-Project.pptx](./Distran-AI-Unit-Project.pptx)
  — open it in PowerPoint (Windows/macOS), Keynote (macOS/iOS), LibreOffice Impress
  (Linux/Windows/macOS), or upload it to Google Slides (any OS, browser). Every slide
  carries its speaker notes in the notes pane.
- **Live slide page (any OS, any modern browser):**

  ```sh
  npm install
  npm run dev
  ```

  then open <http://localhost:5173/s/distran-ai-project>. Arrow keys / PageUp /
  PageDown move between pages; `F` enters fullscreen play mode, `Esc` exits.
  `npm run build && npm run preview` serves a static production build instead.

## Edit the deck

The source is a single slide folder, `slides/distran-ai-project/index.tsx`: an array
of page components, each rendering onto a fixed **1920 × 1080** canvas with absolute
pixel values, plus a `meta` export (title) and a `notes` export (one speaker note per
page — shown in the presenter view and baked into the `.pptx` notes pages). Design
tokens (`palette`, `fonts`, `typeScale`, `radius`) are declared in the exported
`design` const at the top of the file. After editing, re-run `npm run dev` for hot
reload; to regenerate the `.pptx`, re-render each page at 1920×1080 and rebuild the
file (the current export is committed alongside this README).
