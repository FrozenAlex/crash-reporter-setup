# Crash Reporter Setup

A static website that generates CrashReporter AutoConfig QMODs for Beat Saber on Quest. Configuration packages are generated in the browser; no backend or build step is required.

## Files

- `index.html` — page markup
- `style.css` — dark, compact interface
- `app.js` — version loading, form controls, and downloads
- `generator.js` — configuration validation and QMOD generation
- `catalog.json` — fallback version catalog
- `cover.png`, `favicon.svg` — assets
- `vendor/` — JSZip and its license

## Run locally

From the repository directory, with Python installed:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open <http://127.0.0.1:8080>. Use an HTTP server rather than opening `index.html` directly, because the app uses ES modules and fetches local assets.

## Cloudflare Pages

This repository contains ready-to-serve static files at its root. It can be connected to Cloudflare Pages using [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/). No framework or build is needed.

After testing the Pages deployment, add `crgen.frozenalex.com` through the project's [Custom domains settings](https://developers.cloudflare.com/pages/configuration/custom-domains/) and follow the DNS instructions to switch it from the current host.

`README.txt` also contains local-running and manual Direct Upload instructions.

## External services

- Version feed: <https://mods.bsquest.xyz/mods.json>
- Installed CrashReporter upload endpoint: <https://analyze.aeternal.dev/api/upload>
- Reports viewer: <https://analyze.aeternal.dev/crashes/>

This website generates configuration files locally. After installation on the headset, CrashReporter uploads the enabled reports under the chosen username. Installing a generated QMOD replaces the existing CrashReporter configuration.

## Source

Exported from Site version 7, source commit `f678f95f26afe71e73884987f86113d0aef5ce1d`. JavaScript modules were renamed from `.mjs` to `.js`, with their references updated.

JSZip's license is included in `vendor/LICENSE-JSZip.txt`.
