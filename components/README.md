# Components

Product screens and shared UI for Promo Preflight live here.

## Main Screens

- `welcome-screen.tsx` - public entry page, language toggle, workflow preview, tour launcher.
- `intake-form.tsx` - campaign bundle intake, validation, worked examples, draft/report persistence.
- `risk-report.tsx` - check results, issue table, issue detail, export, save campaign run.
- `launch-readiness.tsx` - Go/No-Go board, owners, blockers, dependencies, checklist.
- `handoff-page.tsx` - Slack-style launch handoff preview and export controls.
- `campaigns-page-content.tsx`, `campaign-list.tsx`, `campaign-detail-content.tsx` - local campaign workspace and version history.
- `version-diff.tsx`, `version-diff-content.tsx` - blocker diff between saved campaign versions.
- `rules-page-content.tsx`, `rules-table.tsx` - rules artifact viewer.
- `owners-page-content.tsx`, `owners-table.tsx`, `owner-override-panel.tsx` - owner matrix and campaign-level overrides.

## Shared UI

- `app-shell.tsx`, `sidebar-nav.tsx`, `command-palette.tsx` - workspace shell and navigation.
- `tour-provider.tsx`, `tour-container.tsx`, `tour-launcher.tsx`, `restart-tour-button.tsx` - Driver.js tour integration.
- `ui-states.tsx`, `drawer.tsx`, `run-overlay.tsx`, skeleton components - reusable states and interaction surfaces.

The app intentionally stores demo workspace state in browser `localStorage`; do not introduce durable raw campaign storage in UI components without revisiting the safety model.
