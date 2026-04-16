# Design Document: PWA Support

## Overview

This design adds Progressive Web App (PWA) support to the KSR Fruits React + Vite frontend, making it installable as a native-like Android app. The implementation is entirely additive — no existing source files are modified. All changes are introduced through new configuration, new static assets, and a new offline fallback page.

The approach uses `vite-plugin-pwa`, which integrates with the existing Vite build pipeline to auto-generate a Service Worker (via Workbox) and inject the Web App Manifest into the built `index.html`. This satisfies Chrome for Android's installability criteria: HTTPS, a valid manifest with `standalone` display, required icon sizes, and a registered Service Worker.

---

## Architecture

```
frontend-react/
├── vite.config.js              ← Extended with VitePWA plugin (existing file, additive only)
├── public/
│   ├── icon-192.png            ← NEW: 192×192 app icon
│   ├── icon-512.png            ← NEW: 512×512 app icon
│   ├── icon-512-maskable.png   ← NEW: 512×512 maskable icon
│   └── offline.html            ← NEW: self-contained offline fallback page
└── package.json                ← vite-plugin-pwa added to devDependencies
```

Build output (`dist/`):
```
dist/
├── index.html          ← manifest link + theme-color meta injected by plugin
├── manifest.webmanifest← generated from plugin config
├── sw.js               ← generated Workbox Service Worker
└── workbox-*.js        ← Workbox runtime chunks
```

### PWA Activation Flow

```
Browser visits site (HTTPS / localhost)
        │
        ▼
  index.html loads
        │
        ▼
  main.jsx bootstraps React app
        │
        ▼
  vite-plugin-pwa runtime registers sw.js
        │
  ┌─────┴──────────────────────────────────┐
  │  SW intercepts fetch requests          │
  │  ├─ Static assets → cache-first        │
  │  └─ API (8081–8084) → network-first    │
  └────────────────────────────────────────┘
        │
  Chrome detects installability criteria met
        │
        ▼
  "Add to Home Screen" prompt shown
```

---

## Components and Interfaces

### 1. VitePWA Plugin Configuration (`vite.config.js`)

The existing `vite.config.js` is extended by importing `VitePWA` from `vite-plugin-pwa` and adding it to the `plugins` array. No existing plugin or option is removed or modified.

Key configuration sections:

| Option | Value | Purpose |
|--------|-------|---------|
| `registerType` | `'autoUpdate'` | SW updates silently on new deploy |
| `devOptions.enabled` | `false` | Disables SW in `npm run dev` |
| `manifest.name` | `"KSR Fruits"` | Full app name |
| `manifest.short_name` | `"KSR Fruits"` | Home screen label |
| `manifest.start_url` | `"/home"` | Opens storefront on launch |
| `manifest.display` | `"standalone"` | No browser chrome |
| `manifest.theme_color` | `"#16a34a"` | KSR Fruits green |
| `manifest.background_color` | `"#ffffff"` | Splash screen background |
| `workbox.runtimeCaching` | See below | Per-route caching strategies |

### 2. Workbox Runtime Caching Rules

Two runtime caching rules are configured inside `workbox`:

**Rule A — Cache-First for Static Assets**
- `urlPattern`: matches JS, CSS, image, font files (Vite bundle output)
- `handler`: `CacheFirst`
- `cacheName`: `'static-assets'`
- `expiration`: max 30 entries, 30 days

**Rule B — Network-First for API Calls**
- `urlPattern`: regex matching `localhost:(8081|8082|8083|8084)` and production API origins
- `handler`: `NetworkFirst`
- `cacheName`: `'api-responses'`
- `networkTimeoutSeconds`: 3 (falls back to cache after 3 s)

**Offline Fallback**
- `offlineFallback.document`: `'/offline.html'`
- Served when a navigation request fails and no cached response exists

### 3. App Icons (`public/`)

Three PNG files placed in `frontend-react/public/`:

| File | Size | Purpose |
|------|------|---------|
| `icon-192.png` | 192×192 | Standard Android home screen icon |
| `icon-512.png` | 512×512 | High-res / splash screen icon |
| `icon-512-maskable.png` | 512×512 | Adaptive icon (safe zone: inner 80%) |

All derived from the existing `public/logo.png` asset. The maskable variant has the logo centered within the inner 80% safe zone so Android adaptive shapes (circle, squircle, etc.) do not clip the logo.

### 4. Offline Fallback Page (`public/offline.html`)

A self-contained HTML file with:
- Inline CSS only (no external stylesheets)
- No external script tags
- No external image references
- Displays "KSR Fruits" branding and a message that an internet connection is required
- Uses the KSR Fruits green (`#16a34a`) as the accent color to match the app theme

### 5. Service Worker Lifecycle

```
First visit:
  SW installs → precaches app shell (index.html + Vite chunks)

Subsequent visits:
  SW intercepts fetch → serves from cache (static) or network (API)

New deployment:
  SW detects updated precache manifest → installs new SW in background
  registerType: 'autoUpdate' → activates immediately, page reloads

Offline:
  Navigation request → SW checks cache → miss → serves offline.html
  API request → SW tries network → timeout → returns cached response or error
```

---

## Data Models

### Web App Manifest (generated at build time)

```json
{
  "name": "KSR Fruits",
  "short_name": "KSR Fruits",
  "description": "Fresh fruits and dry fruits delivered to your door",
  "start_url": "/home",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Workbox Precache Manifest Entry (example)

```json
{
  "url": "/assets/index-Bx3kLmNp.js",
  "revision": "abc123"
}
```

Workbox generates this automatically from the Vite build output. The revision hash changes on each build, triggering SW updates.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After prework analysis, only one acceptance criterion (6.4) yields a meaningful universal property. All other criteria are configuration checks, fixed-value assertions, or infrastructure/manual verifications that are better served by example-based or smoke tests.

**Property Reflection:** The single property identified (self-contained offline page) is unique and non-redundant — no other criterion overlaps with it.

### Property 1: Offline fallback page has no external dependencies

*For any* resource reference (stylesheet link, script tag, image source) found in `offline.html`, the reference SHALL NOT point to an external URL (i.e., no `src` or `href` attribute value starting with `http://` or `https://`).

**Validates: Requirements 6.4**

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| SW registration fails (non-HTTPS, browser blocks SW) | `vite-plugin-pwa` wraps registration in a try/catch; app continues as a standard SPA with no degradation |
| Network request fails and no cache entry exists | SW serves `offline.html` for navigation requests; API requests receive a network error that the existing Axios error handlers already manage |
| SW update check fails | Silent failure; existing SW continues serving the current version |
| Icon files missing from `public/` | Build succeeds but manifest references broken icon URLs; Chrome will not show install prompt — caught during build verification |
| `offline.html` not precached | SW cannot serve fallback; navigation fails with browser default offline page — mitigated by including `offline.html` in `workbox.additionalManifestEntries` |

### SW Registration Guard

The plugin's generated registration script checks `location.protocol` before registering. In HTTP (non-localhost) contexts the registration is skipped entirely, satisfying Requirement 5.1 without any custom code.

---

## Testing Strategy

### PBT Applicability Assessment

This feature is primarily configuration-driven (Vite plugin options, manifest JSON, Workbox rules) and produces static build artifacts. The vast majority of acceptance criteria are fixed-value checks or infrastructure verifications. Only one criterion (6.4 — offline page self-containment) yields a universal property suitable for property-based testing.

### Unit / Example Tests

These cover the concrete, fixed-value acceptance criteria:

| Test | Criteria | What to assert |
|------|----------|----------------|
| Manifest name fields | 1.1 | `name === "KSR Fruits"`, `short_name === "KSR Fruits"` |
| Manifest display + start_url | 1.2, 1.3 | `display === "standalone"`, `start_url === "/home"` |
| Manifest colors | 1.4 | `theme_color === "#16a34a"`, `background_color === "#ffffff"` |
| Manifest icons sizes | 1.5 | icons array contains 192×192 and 512×512 entries |
| Manifest maskable icon | 1.6 | at least one icon has `purpose` containing `"maskable"` |
| Cache-first strategy config | 2.2 | Workbox config includes CacheFirst handler for static asset patterns |
| Network-first strategy config | 2.3 | Workbox config includes NetworkFirst handler for API port patterns |
| Offline fallback content | 6.3 | `offline.html` contains "KSR Fruits" and internet connection message |
| SW registration guard | 5.1 | Registration skipped on non-HTTPS non-localhost origin |
| App resilience on SW failure | 2.6 | App renders normally when `navigator.serviceWorker.register` rejects |

### Property-Based Test

**Property 1: Offline fallback page has no external dependencies**

Using a property-based testing library (e.g., `fast-check` for JavaScript):

- Generator: produces variations of `offline.html` content (the file is static, so the "property" is verified by parsing the actual file and checking all resource references)
- In practice: parse `offline.html` with an HTML parser, extract all `src`/`href` attributes from `<link>`, `<script>`, and `<img>` elements, assert none start with `http://` or `https://`
- Tag: `Feature: pwa-support, Property 1: offline fallback page has no external dependencies`
- Minimum 100 iterations (applied to generated HTML variants with injected external refs to verify the checker itself)

### Smoke Tests (Build Verification)

Run after `vite build`:

- `dist/sw.js` exists
- `dist/manifest.webmanifest` exists and is valid JSON
- `dist/index.html` contains `<link rel="manifest">`
- `dist/index.html` contains `<meta name="theme-color"`
- `frontend-react/public/icon-192.png` exists
- `frontend-react/public/icon-512.png` exists
- `frontend-react/public/icon-512-maskable.png` exists
- `frontend-react/public/offline.html` exists

### Manual / End-to-End Tests

- Visit deployed site on Chrome for Android over HTTPS → confirm install prompt (Req 1.7)
- Install app → confirm standalone launch, correct icon, correct start URL (Req 4.3)
- Go offline → navigate to app → confirm `offline.html` is served (Req 2.4, 6.2)
- Deploy new version → confirm SW auto-updates (Req 2.5)
