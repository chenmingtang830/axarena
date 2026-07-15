# AXArena Database Publication Site

AXArena is a neutral, open-source agent usability benchmark. It helps
developers understand which products are genuinely agent-friendly—especially
across APIs, CLIs, and discoverability—without judging overall product quality.

Static, dependency-free publication site for `axarena.ai`. The primary
leaderboard is `/database/`; the reusable AXArena evaluation methodology lives
at `/methodology/`. The launch article lives at
`/blog/introducing-axarena/`. Legacy vendor and report URLs remain compatible.

Visual language, palette tokens, reusable components, and modification rules
are documented in [`DESIGN.md`](./DESIGN.md).

The benchmark JSON files under `data/axarena-database-v1/` use the same
versioned schemas as `ax-eval export-publication`. They are an explicitly
watermarked draft fixture. After every publication gate passes, replace the
schema-produced JSON files with a sanitized frozen export and retain
`editorial.json` as the website-owned narrative layer; the site never reads raw
run directories or recomputes ranking.

## Local verification

```bash
npm test
python3 -m http.server 4173
```

Open `http://localhost:4173/database/`. Before production deployment, verify
desktop, mobile, keyboard navigation, print layout, evidence downloads, legacy
redirects, and that the Draft banner disappears only when `publication.json`
is `publication_ready`, every gate passes, all ranks are complete, and the
editorial copy contains no draft language.

## Vercel

Use this repository as the project root. Framework preset: Other; no build
command; output directory `.`.
