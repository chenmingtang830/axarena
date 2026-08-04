# AXArena presentation layer

Static, evidence-first publication frontend for AXArena. This branch contains a shared production foundation and three clickable visual directions for AXArena-Database v1:

- `/prototypes/verdict/` — conclusion-first launch story.
- `/prototypes/ledger/` — evidence and provenance ledger.
- `/prototypes/journey/` — diagnostic agent-execution profile.

The canonical `/database/` route uses the progressively disclosed Evidence Ledger. Every prototype consumes the same strict synthetic fixture under `public/data/axarena-database-v1-synthetic/`; real vendor names are used, but every value is synthetic and non-citable.

## Stack

Next.js App Router, TypeScript, Tailwind CSS v4, Zod, React SVG, and `d3-scale`. `output: "export"` keeps hosting portable. There is no auth, database, Server Action, or runtime ranking.

## Commands

```bash
npm install
npm run validate:data
npm test
npm run typecheck
npm run build
```

`validate:data` fails closed on missing files, unknown schema versions, duplicate trial/evidence IDs, rank mismatch, cohort mismatch, unresolved evidence references, editorial references, and common sensitive-text patterns.

The production numeric contract is exported by `ax-eval/ax-arena`; this repository owns only the presentation and editorial/catalog layer.
