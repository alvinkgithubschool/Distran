# Creator rooms, profiles and discovery

Implemented 2026-11-12 in the shared Tauri/React interface. Games, films and television remain the supported formats. Run `pnpm api` for live directory data and `pnpm app` for the native preview, or `pnpm dev` for the browser preview.

## Try the flows

1. Sign in as `creator@distran.test` with `DistranDemo2026!`, or choose **Try as a creator**. Complete or skip setup.
2. Profile → **Open your creator page** → **Customize page**. Add a headline, choose one of five accent colors and select up to six works. Selection order controls display order. Live works become selectable after opening them in Discover.
3. Settings → **Edit profile**. Edit the name, username, bio and website; upload a profile picture and banner. These images appear on the personal profile, creator room and account avatars. Use the remove controls to restore defaults.
4. Open any title → **Claim your credit**. Provide a credited role, public evidence URL and optional note. Save the request, reload, then follow **Claim pending · View request** to inspect or withdraw it.
5. Discover → **Find creators**. Search names/studios through TMDB/IGDB, or usernames through the **On Distran** filter. Open a directory entry to browse credits, or a Distran profile to see its selected works. Follow/unfollow works for both, with readable names and persistent links in Profile → **In your orbit**.

The regular account remains `user@distran.test`, with the same preview password. Browser and native origins have separate local storage.

## Membership and ownership are different

The sparkle icon, colored avatar outline and glow mean **On Distran**: a creator account exists in this device's preview database. Provider directory entries do not receive this badge. A provider person/company is not automatically linked to a local account by matching display names. Private creator profiles are excluded from other accounts' directory and direct profile reads; the owner can still see their own page.

A claim is currently a **local pending request**, not an approved credit, published ownership assertion, verified identity or permission to edit provider metadata. The creator desk is visible only to that account. Requests can be withdrawn; duplicate work requests are rejected. Self-selected creator roles cannot approve claims, edit official titles or earn a verified ownership badge. Selected portfolio works are labelled as personal selections/inspirations.

Before shared deployment, use authenticated account IDs, server-side claim storage and a moderator-only review transition. Keep evidence and review notes private. Model `pending → approved / rejected / withdrawn` with an immutable audit trail, verified provider entity IDs, role-specific edit permissions, duplicate/conflicting claim review and revocation. Ownership decisions must come from the server; never trust local storage or a role selector. These services are not implemented in this loopback preview.

## Routes and modules

| Surface | Route / module |
|---|---|
| Creator search | `/creators`, optional `?q=…`; `pages/CreatorsPage.tsx` |
| Creator room / directory profile | `/creators/:id` |
| Work claim form | Title page → `components/ClaimEditor.tsx` |
| Profile image preparation | `components/ProfileImages.tsx` |
| Claim and username rules | `lib/store.ts` |
| Catalog credit connections | `lib/creators.ts` |
| Spotlight controls | `components/FeaturedCarousel.tsx` |
| Artwork palette | `lib/use-poster-palette.ts` |
| Responsive additions | `styles/creators.css`, imported after existing responsive rules |

Provider creator IDs are `tmdb:person:525` and `igdb:company:908`. Existing curated name routes remain available. Local creator routes use account IDs. Following a provider uses its stable provider ID and stores its display name separately; existing name-based follows remain readable. Following a Distran account uses `profile:<accountId>`.

## Live directory contracts

- `GET /v1/creators/search?q=…&page=1`: 2–100 characters, pages 1–50. Returns `items`, `status`, `providers`, `errors`, `page`, `hasMore`. Search results do not fetch per-person details. TMDB searches people; IGDB searches companies with a JSON-escaped, case-insensitive name filter. Partial provider failures retain available results. Matching locally known makers remain available alongside provider matches.
- `GET /v1/creators/{creatorId}`: returns `creator`, `works`, `cache`. TMDB uses combined movie/TV credits, excludes adult results and displays a bounded deduplicated selection. IGDB currently shows up to 40 **developed** games, not a complete publishing history. These are provider credits, not verified Distran ownership.

All requests use the existing server-only credentials, shared connection pool, provider rate gates, token refresh, bounded persistent cache, single-flight coalescing and stale fallback. Searches cache for 30 minutes; creator details for one day. Both routes use the shared admission gate and bounded timeouts. Browser searches debounce 350 ms and abort obsolete requests. Existing frontend response cache remains bounded to 100 entries for 60 seconds. No provider credential is sent to the UI.

Technical references: [TMDB person search](https://developer.themoviedb.org/reference/search-person), [TMDB combined credits](https://developer.themoviedb.org/reference/person-combined-credits), [IGDB companies and query filters](https://api-docs.igdb.com/#company).

## Saved data and images

Optional fields extend the existing version-1 account records: `avatar`, `banner`, `accent`, `headline`, `featuredWorks`, `claims`, `followedCreatorNames`. Existing accounts load without resetting their logs or collections. Claims include work ID, credited role, evidence, note, request ID, date and forced `pending` status. Claimed and featured provider works are included in saved metadata snapshots, so they survive offline reloads.

Usernames accept 3–24 lowercase letters, digits or underscores and must be unique within this device's accounts. Name changes do not change account IDs. New accounts get a unique valid username, including short or duplicate display names.

JPEG, PNG and WebP uploads are limited to 8 MB, decoded, center-cropped and re-encoded to JPEG (avatar 256×256; banner 1200×400; quality 0.78). Each stored image is capped at 650,000 data-URL characters. SVG and other formats are rejected. The input picker previews changes before Save; image processing disables Save. Storage failure leaves committed state unchanged and displays an error. Local quota is finite; hosted object storage, EXIF-aware crop controls and cross-device upload sync are later work.

## Home and mobile title composition

Home rotates through three **editorial** spotlights (It Takes Two, Dune: Part Two, Severance), every eight seconds. The heading, image, metadata and log/open actions all follow the current slide. Previous/next, direct slide selectors and play/pause are keyboard accessible. Hover, focus, hidden tabs and open dialogs pause automatic advancement; manual slide selection stops autoplay. Reduced-motion preferences default autoplay off and suppress the reveal animation. This is not represented as a trained personalized recommendation model.

At widths up to 600 px, title posters are centered at up to 280 px wide, sized against viewport height, with the title, creator, rating and actions below. All four actions remain visible, including Top 4. Desktop keeps its side-by-side composition. The ambient image is more vivid on mobile, with a sampled poster color in the surrounding gradient/shadow. Palette extraction downsamples to 32×32, ignores nearly black/white/gray pixels and selects a weighted quantized color cluster. Results are cached in memory. Cross-origin/image/canvas failures fall back to the catalog color without breaking the poster.

## Design and interaction review

Refactoring UI: **8/10**. Poster hierarchy, bounded text, deliberate spacing, image proportions, non-color membership labels and responsive action placement are implemented. Reaching 10/10 requires device testing, a formal contrast audit of every chosen accent and user-tested cropping controls.

Microinteractions: **8/10**. Claim errors, pending/withdraw states, upload previews/busy/error states, selected swatches, bounded portfolio selection, saved-state feedback and controllable rotation are implemented. Reaching 10/10 requires assistive-technology checks and native WKWebView file-picker/lifecycle testing. Current browser coverage uses Chromium.

Screenshots: `docs/preview/creator-page-desktop.png`, `custom-profile-mobile.png`, `poster-title-mobile.png`.

## Provider attribution and creator-page icons — 2026-11-16

Games prioritise developing studios; films prioritise directors; TV prioritises series directors from aggregate credits, then credited episode directors. The orbit icon identifies an internal creator page, including cached provider pages. The fingerprint On Distran badge remains a separate local member indicator, never verified ownership. Cast/crew/company credits link by provider identity and remain browsable from title details. See [reconciliation and migration rules](CATALOG_RECONCILIATION.md).
