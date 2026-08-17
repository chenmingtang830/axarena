# AXArena Database Publication Site

AXArena is a neutral, open-source agent usability benchmark. It helps
developers understand which products are genuinely agent-friendly—especially
across APIs, CLIs, and discoverability—without judging overall product quality.

Static, dependency-free publication site for `axarena.ai`. The primary
vendor-experience report is `/database/`; the reusable AXArena evaluation methodology lives
at `/methodology/`. The launch article lives at
`/blog/introducing-axarena/`. Legacy vendor and report URLs remain compatible.

Visual language, palette tokens, reusable components, and modification rules
are documented in [`DESIGN.md`](./DESIGN.md).

The current report consumes the frozen vendor-first V2.4 package under
`data/axarena-database-v2.4/`. It treats J01 end-to-end success as the primary
outcome, atomic tasks as diagnostics, and model/provider rows as supplementary
slices. The older files under `data/axarena-database-v1/` remain an explicitly
watermarked historical fixture for the methodology and launch article. After every publication gate passes, replace the
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
