# Figma → Distran

## Source map

| Node | Source surface | Implementation |
|---|---|---|
| 14:1880 | Home / For you | Home spotlight, shelves, collections, contextual discovery |
| 14:5065 | Home / Upcoming & discover | Home Up next queue, disabled Buddy and editorial discovery |
| 14:9162 | Discover | Search, medium cards, mood chips, creator follows and catalog grid |
| 14:9781 | Lists | Collection cards and stacked artwork; new list/detail/order/edit flows |
| 14:6576 | Format switcher | Every format dialog; active games/films/TV, later formats disabled |
| 14:11749 | Profile | Bio, actual local counts, Top 4 per medium, followed creators and ledger |
| 14:11031 | Buddy & friends | Disabled Buddy plus functional local conversation-draft surface |
| 14:7970 | Title / Pub Royal | Work-specific atmosphere, maker links, credits, log/list/favourite actions; media scope adapted to games/film/TV |
| 14:1811 | Partner room / Dune | Full-bleed Dune editorial room with log and title links; no paid campaign machinery |
| 14:792 | Sign in | Typography, dark form, cream primary action, format chips; derived local signup/recovery/setup |

Raw specifications are `figma-*.txt`; supplied-screen exports are under `screens/`. The retained PDF text is `presentation.txt`. References are inputs to the design, not image-based UI pages.

## Visual system

Use the original #070708 background and #F2EFE8 warm ink, with lime/olive, amber and cyan tied to media. Abel supplies expressive headings and readable body copy; DM Mono supplies utility labels. Both are bundled font assets via Fontsource. The Doto wordmark treatment is simplified to a small code-native symbol/wordmark so no third ornamental font is needed.

Desktop gets a quiet navigation spine, a readable central feed and an optional contextual orbit panel. Phone widths get the supplied bottom-navigation idea, inset content, compact shelves and scrollable dialogs. There are distinct breakpoints for wide desktop, narrow desktop/tablet and phone, rather than shrinking a fixed 402px canvas.

Cards use real title artwork, a controlled border/shadow scale and overlays where text sits on images. Backgrounds come from the supplied Figma artwork; the featured game's hero uses that game's Steam asset. Public preview cover assets are listed in `ASSETS.md`. The original presentation forbids generated stills; no generated imagery is used.

## Interaction and accessibility

Buttons/links have visible keyboard focus and meaningful labels. Native HTML dialogs provide modal focus trapping and Escape dismissal. Forms expose errors inline, half-star selection is keyboard accessible, list/favourite ordering has named arrow controls, toggles expose switch semantics, empty states have next actions, and toast announcements use a status region. Reduced-motion preferences disable transitions/animations. Responsive tests check for horizontal overflow.

The preview intentionally distinguishes stored preferences from live authorization, local drafts from delivered messages, illustrative ratings from live community metrics, and unverified creator profiles from title ownership. Buddy and connections are disabled rather than simulating successful API calls.

## Review

The initial Compose placeholder was approximately **2/10** against the Refactoring UI skill's hierarchy/spacing/type/imagery criteria. The current implementation is approximately **8.5/10**: it follows the source's hierarchy, has real artwork, consistent tokens, usable empty/editor states, keyboard semantics and tested responsive workflows. Reaching 10/10 requires real-device/WKWebView accessibility review, larger live catalogs, provider error/loading states, and customer usability testing. These are design judgments, not measured user-study scores.

## Creator and mobile additions — 2026-11-12

Creator directory/rooms add a membership sparkle and glow, themed cover, identity, optional headline and portfolio. Profile settings now preview uploaded pictures/banners. A local credit-claim form exposes pending and withdrawn states. Home has three rotating editorial spotlights with explicit pause and navigation. On phones only, larger centered posters lead the title page and feed a sampled ambient palette; ratings and actions sit below. Desktop title composition is preserved. [Details and design review](../CREATOR_PROFILES.md).
