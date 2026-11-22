# Open Distran

From the repository root:

```sh
pnpm install
pnpm app
```

The **Distran** native Tauri window opens on macOS. An Android target device is not needed. The old Android project, run configuration and emulator launcher have been removed. VS Code also includes a **Distran: Tauri app** launch configuration.

The browser preview uses the same React screens: `pnpm dev`, then <http://127.0.0.1:1420>. The desktop layout has a navigation spine, main reading surface and contextual discovery panel. Under 600px it becomes a phone layout with a bottom navigation bar. Resize the native window to inspect both.

## Test logins

| Role | Email | Password |
|---|---|---|
| User | user@distran.test | DistranDemo2026! |
| Creator | creator@distran.test | DistranDemo2026! |

Use the quick-entry buttons or enter these credentials. First login opens three setup steps: profile, interests and Top 4. **Skip for now** saves the defaults and opens Home. The creator path adds an optional studio website and marks the profile as On Distran (membership, not verified ownership). It does not grant control over catalog titles.

Profiles and data live in a versioned local storage record, `distran.tauri.preview.v1`. Each account has a separate ledger, collections, favourites, preferences and messages. Closing/reopening and signing out retain data. Clearing the app/WebView storage removes it. Browser, Tauri development and bundled-app origins may have separate stores; no cross-device sync or migration of Android preferences is implemented.

Additional local profiles can be created in the signup flow. Their passwords are salted and derived with PBKDF2 rather than stored as text. These local sessions are a preview convenience, not a backend security boundary. API authorization will use hosted AuthKit tokens later. The shipped preview fixture passwords are intentionally public.

## Try the flows

1. Home → **Log it** → select a rating/status, leave a note → save.
2. Discover → search a title, maker or mood → open a work → **Want to**. Return Home → **Up next**.
3. Lists → **New list** → mix games, films and series → reorder with the arrow controls → save.
4. Profile → **Make it yours** → choose and reorder up to four favourites per medium.
5. Buddy & friends → write a message to a fictional preview contact. It saves locally and is not delivered.
6. Settings → edit profile, change preferences, view/copy your account export, or sign out.

Buddy, external app connections and later media formats are disabled. Discover uses live TMDB/IGDB when `pnpm api` is running; see `CATALOG_API.md`. The curated collection and static ratings are labelled as preview data. Catalog images are bundled so screens can render offline after the app is built.

## Builds and data

`pnpm build` creates the frontend bundle in `apps/desktop/dist`. `pnpm app:build` creates a native app under `apps/desktop/src-tauri/target/release/bundle/macos/`. The verified local debug bundle is at `apps/desktop/src-tauri/target/debug/bundle/macos/Distran.app` (built with `pnpm --dir apps/desktop tauri build --debug --bundles app`). Native compilation artifacts are ignored by Git. For a smaller code-only checkout after closing the app, `cargo clean --manifest-path apps/desktop/src-tauri/Cargo.toml` removes generated native builds; the next launch will rebuild them.

The default build is explicitly demo mode. To check a build without fixture login, run `pnpm --dir apps/desktop build:production`; hosted authentication is still pending. Desktop previews do not prove native Android/iOS support has been packaged or tested.

## Design previews

Actual browser captures of the shared Tauri UI are in `docs/preview/`. They cover sign in, home, discovery, lists, profile and settings on desktop, with mobile versions of the core screens. They are not screenshots of an Android emulator or a pixel-perfect claim for every Figma node.

## Live catalogs

Install the [backend environment](../backend/README.md), then run `pnpm api` in a second terminal. The supplied credentials are already stored in the private, ignored `backend/.env`. The browser/native app needs only the public API URL. Search and title details use live providers; logged/listed/favourite titles keep local metadata snapshots for offline use. A bundled app still needs this separately running API; it does not contain provider keys or a Python sidecar.

## Creator rooms and profile customization

Discover → **Find creators** searches TMDB people/IGDB companies and local Distran accounts. Profile → **Open your creator page** → **Customize page** edits the headline, accent and featured works. Settings → **Edit profile** edits name, username, picture and banner. Open a title as a creator to request a credit claim, then inspect/withdraw it on the creator page. Requests are saved locally as pending; moderator approval is not implemented. See [CREATOR_PROFILES.md](CREATOR_PROFILES.md). Home now cycles through three editorial recommendations with pause/previous/next controls. Mobile title pages center a larger poster above metadata and actions.
