# Requirements Document

## Introduction

This feature adds Progressive Web App (PWA) support to the KSR Fruits React frontend (Vite-based). The goal is to make the app installable as a native-like Android app — and on other platforms — directly from the browser, without modifying any existing source code. This is achieved by adding a Web App Manifest, a Service Worker, and the necessary PWA plugin configuration alongside the existing Vite setup.

The PWA must meet Android's installability criteria so users can add KSR Fruits to their home screen and launch it in a standalone window, with an app icon, splash screen, and offline fallback.

## Glossary

- **PWA**: Progressive Web App — a web application that uses modern browser APIs to deliver app-like experiences including installability, offline support, and home screen presence.
- **Web_App_Manifest**: A JSON file (`manifest.json` or `manifest.webmanifest`) that tells the browser how to display the app when installed — name, icons, theme color, display mode, etc.
- **Service_Worker**: A background script that intercepts network requests and enables caching, offline support, and push notifications.
- **Vite_PWA_Plugin**: The `vite-plugin-pwa` npm package that auto-generates the Service Worker and injects the Web App Manifest into the Vite build without touching existing source files.
- **Install_Prompt**: The browser-native "Add to Home Screen" banner or button that appears when PWA installability criteria are met.
- **Standalone_Mode**: A display mode where the installed PWA launches without browser chrome (no address bar), resembling a native app.
- **Offline_Fallback**: A cached page served by the Service Worker when the network is unavailable.
- **App_Shell**: The minimal HTML/CSS/JS needed to render the app's UI frame, cached by the Service Worker for instant load.
- **Cache_Strategy**: The Service Worker caching approach — e.g., cache-first for static assets, network-first for API calls.
- **Android_Installability_Criteria**: Chrome on Android requires: HTTPS, a valid Web App Manifest with `name`, `short_name`, `start_url`, `display: standalone`, at least one 192×192 icon and one 512×512 icon, and a registered Service Worker.

---

## Requirements

### Requirement 1: Web App Manifest

**User Story:** As a customer, I want to install KSR Fruits on my Android home screen, so that I can launch it like a native app without opening a browser.

#### Acceptance Criteria

1. THE Web_App_Manifest SHALL declare `name` as "KSR Fruits" and `short_name` as "KSR Fruits".
2. THE Web_App_Manifest SHALL set `display` to `standalone` so the installed app launches without browser chrome.
3. THE Web_App_Manifest SHALL set `start_url` to `/home` so the app opens on the storefront after installation.
4. THE Web_App_Manifest SHALL set `background_color` to `#ffffff` and `theme_color` to `#16a34a` (KSR Fruits green).
5. THE Web_App_Manifest SHALL include at least one icon of size 192×192 pixels and one icon of size 512×512 pixels in PNG format.
6. THE Web_App_Manifest SHALL include a maskable icon variant so Android adaptive icon shapes are supported.
7. WHEN a user visits the KSR Fruits site on Chrome for Android over HTTPS, THE Browser SHALL display an "Add to Home Screen" install prompt.

---

### Requirement 2: Service Worker Registration

**User Story:** As a customer, I want the app to load quickly and work even when my connection is poor, so that I can browse products without interruption.

#### Acceptance Criteria

1. THE Vite_PWA_Plugin SHALL generate and register a Service Worker automatically during the Vite build process.
2. THE Service_Worker SHALL use a cache-first strategy for all static assets (JS, CSS, images, fonts) bundled by Vite.
3. THE Service_Worker SHALL use a network-first strategy for all API requests to the backend services (ports 8081–8084) so customers always receive fresh data when online.
4. WHEN the network is unavailable, THE Service_Worker SHALL serve a cached offline fallback page informing the user that an internet connection is required.
5. WHEN a new version of the app is deployed, THE Service_Worker SHALL detect the update and prompt the user to reload so they receive the latest version.
6. IF the Service Worker registration fails, THEN THE App SHALL continue to function normally as a standard web application without any degradation.

---

### Requirement 3: PWA Plugin Configuration

**User Story:** As a developer, I want PWA support added via Vite plugin configuration only, so that no existing source files are modified.

#### Acceptance Criteria

1. THE Vite_PWA_Plugin SHALL be added as a new dev dependency (`vite-plugin-pwa`) without modifying any existing dependency.
2. THE Vite_PWA_Plugin SHALL be configured exclusively inside `vite.config.js` by extending the existing plugin array.
3. THE Vite_PWA_Plugin SHALL auto-inject the `<link rel="manifest">` and theme-color `<meta>` tags into `index.html` at build time without requiring manual edits to `index.html`.
4. THE Web_App_Manifest SHALL be generated from the plugin configuration rather than a hand-written static file, so manifest and config stay in sync.
5. THE Vite_PWA_Plugin SHALL be configured with `registerType: 'autoUpdate'` so the Service Worker updates automatically without requiring custom update logic in existing components.

---

### Requirement 4: App Icons

**User Story:** As a customer, I want to see the KSR Fruits logo as the app icon on my home screen, so that I can identify the app easily.

#### Acceptance Criteria

1. THE PWA SHALL provide icon assets at the following sizes: 192×192 and 512×512 pixels.
2. THE PWA SHALL provide a maskable icon variant at 512×512 pixels with sufficient safe-zone padding so Android adaptive icon shapes do not clip the logo.
3. WHEN the app is installed on Android, THE Android_Launcher SHALL display the KSR Fruits icon derived from the existing `logo.png` asset.
4. THE icon files SHALL be placed in the `frontend-react/public/` directory so they are served as static assets without any build transformation.

---

### Requirement 5: HTTPS Requirement

**User Story:** As a developer, I want to ensure the PWA only activates in production over HTTPS, so that Service Worker security requirements are met.

#### Acceptance Criteria

1. THE Service_Worker SHALL only be registered when the app is served over HTTPS or on `localhost`.
2. WHERE the app is deployed to production, THE Deployment SHALL serve the frontend over HTTPS so Android installability criteria are satisfied.
3. THE Vite_PWA_Plugin SHALL be configured to disable Service Worker registration in development mode (`npm run dev`) to avoid stale cache issues during development.

---

### Requirement 6: Offline Fallback Page

**User Story:** As a customer, I want to see a friendly message when I open the app without internet, so that I understand why content is not loading.

#### Acceptance Criteria

1. THE PWA SHALL include a static offline fallback HTML page (`offline.html`) served from the `public/` directory.
2. WHEN the network is unavailable and the requested resource is not in the cache, THE Service_Worker SHALL serve the offline fallback page.
3. THE offline fallback page SHALL display the KSR Fruits name and a message indicating that an internet connection is required to browse products.
4. THE offline fallback page SHALL be a self-contained HTML file with no external dependencies so it renders correctly without any network access.
