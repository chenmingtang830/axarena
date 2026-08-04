# AXArena-Database presentation sprint

## Decision record

The formal frontend starts from a blank Next.js App Router skeleton. It does not fork a Vercel marketplace admin/SaaS template: those templates introduce authentication, database state, and generic dashboard navigation that conflict with a portable research publication. The implementation borrows only the useful portfolio-starter patterns—static content, metadata, Open Graph, sitemap, and Markdown siblings.

`output: "export"` is load-bearing. The site has no database, Server Actions, runtime rank calculation, or host-specific API.

## Information architecture

The selected direction is Evidence Ledger with progressive disclosure. `/database/` and `/prototypes/ledger/` first present one shareable cross-configuration mean + min–max range chart, followed by a dense analysis table that keeps each harness × model configuration and surface visibly separate. The task matrix is always visible. A product opens one report sheet; tasks list every run and all three trials, and trial evidence expands inline with prompt, sanitized log, output, oracle, efficiency, and provenance.

- `/database/` — canonical publication status, shareable verdict, agent/surface views, stored leaderboard, and an explicitly revealed task matrix.
- `/database/compare/` — shareable agent/surface/vendor comparison.
- `/database/vendors/[vendor]/` — static fallback/deep-link artifact. Primary exploration uses `?panel=vendor&vendor=…` in the report sheet.
- `/database/tasks/[task]/` — static fallback/deep-link artifact. Primary exploration nests the task inside the open vendor report.
- `/database/trials/[trial-id]/` — static fallback/deep-link artifact. Primary exploration nests the oracle receipt inside the same report sheet.
- `/methodology/`, `/reproduce/`, `/independence/`, `/changelog/`, `/data/` — trust and download layer, with adjacent `.md` resources.
- `/prototypes/verdict/`, `/prototypes/ledger/`, `/prototypes/journey/` — the three visual directions, each with compare/vendor/task/trial routes.

## Presentation contract resolved before production execution

- `publication.json` identity, status, cohort, batch, pins, quality gates, and integrity.
- Independent per-configuration Overall/API/CLI results in a horizontally explorable evidence table. Stable `configuration_id` values allow multiple models under Pi or OpenCode without collisions.
- Canonical task title, intent, difficulty, core/research kind, applicability, and allowed surfaces.
- Three-trial states, redacted oracle summaries, errors, diagnostic efficiency, and deterministic journey phases.
- Stable evidence IDs, SHA-256, public paths, and cross-reference validation.
- Separate Agent Discovery/static readiness output with `affects_usability_rank: false`.
- Explicit failure classification state; the frontend never invents causes.
- Build-time Zod validation, duplicate-ID detection, redaction scan, evidence resolution, cohort checks, and stored-rank parity.

## Still required before a citable launch

1. Complete the deferred production rerun and replace the synthetic bundle without changing the frontend contract.
2. Publish the sealed evidence paths and verify every `public_path` against the deployed static tree.
3. Populate reviewed static-readiness results; keep them outside usability rank.
4. Complete human/deterministic failure classification. Until coverage is sufficient, do not render a causal failure chart.
5. Editorial review vendor descriptions, limitations, findings, source links, and corrections language.
6. Confirm production token/cost availability. Unavailable values remain explicit and never enter rank.
7. Run final axe and Lighthouse against the intended deployment origin, plus an external link check.

## Local review

```bash
npm install
npm run validate:data
npm test
npm run typecheck
npm run build
npm run dev
```

Open `/prototypes/ledger/` for the selected progressive-disclosure direction. Verdict and Journey remain available as comparison prototypes, but the canonical `/database/` route now uses the Ledger system.
