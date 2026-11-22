# Artwork and fonts

The preview uses existing media/design assets, never generated stills.

- `forest.jpg`: original image fill from Figma node 56:12, file avHBE9UMP7CjnFylwCgGxL; used as an ambient sign-in background.
- `dune-room.png`: original Figma node 14:1812 image fill; used in the Dune editorial room.
- Game covers: Steam CDN `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{app_id}/library_600x900.jpg`. IDs: It Takes Two 1426210; Cyberpunk 2077 1091500; Elden Ring 1245620; Disco Elysium 632470; Baldur’s Gate 3 1086940; Outer Wilds 753640; The Exit 8 2653790. The hero uses It Takes Two's `library_hero.jpg`.
- Film/series covers: TMDB image service, `https://image.tmdb.org/t/p/w500/{poster}`. Dune Part Two: `1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg`; Blade Runner 2049: `gajva2L0rPYkEWjzgFlBXCAVBE5.jpg`; Arrival: `x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg`; Severance: `pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg`; Edgerunners: `v3JuB15WybKmxDeT1hWdK3j6eSJ.jpg`.
- Abel and DM Mono: bundled through `@fontsource/abel` and `@fontsource/dm-mono`. Preserve the packages' font licenses when distributing.
- Icons: Lucide React, ISC license. Brand icon: repository-native SVG at `apps/desktop/public/brand.svg` and generated Tauri macOS icon files.

Posters and supplied artwork remain the property of their rights holders. Availability on a public CDN is not an open-content license; review the applicable display/redistribution terms before publishing. The in-app Settings page includes attribution and the TMDB non-endorsement notice. No cover artwork is used as training input.

Work descriptions and mood tags are editorial fixture text in `catalog.ts`. Ratings are illustrative preview values and are not represented as actual Distran user aggregates. Provider access/terms and future catalog integration are documented separately in `docs/research/SOURCES.md`.
