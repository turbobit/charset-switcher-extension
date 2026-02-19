# Deployment Guide

## Chrome Web Store package

Run:

```bash
npm run package:chrome
```

Output:

- `dist/chrome-store/extension/` (packed source)
- `dist/chrome-store/charset-switcher-extension-v<version>.zip`

## Full release build

Run one command:

```bash
npm run release
```

This does:

1. Clean `dist/`
2. Build GitHub Pages files in `docs/`
3. Build Chrome Web Store zip in `dist/chrome-store/`

## GitHub Pages

- Workflow file: `.github/workflows/pages.yml`
- Source folder: `docs/`
- Trigger: push to `main` or manual run

Repository settings requirement:

- Settings -> Pages -> Build and deployment -> Source = `GitHub Actions`