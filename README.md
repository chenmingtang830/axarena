# AXArena Static Prototype

Static prototype for `axarena.ai`.

## Local Preview

From this directory:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/database/`.

## Vercel

Use `axarena-site` as the Vercel project root.

- Framework preset: Other
- Build command: none
- Output directory: `.`
- Domain: point `axarena.ai` / `www.axarena.ai` from Squarespace DNS to Vercel

This prototype uses placeholder DAEB-1 data from `data/placeholder.js`. Replace
that module with data derived from the frozen `publication-bundle` manifest when
the real runs finish.
