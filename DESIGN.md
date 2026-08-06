# AXArena presentation design system

AXArena is an independent research publication, not a SaaS dashboard. Its interaction rhythm is **cross-configuration average + range → dense harness × model analysis table → always-visible task matrix → vendor report sheet with inline trial evidence**. Product evidence never navigates through nested report pages: each task exposes the complete three-trial series, and a selected trial expands its prompt, sanitized execution log, output, oracle, diagnostics, and provenance in place.

## Shared rules

- Outcome authority: live-state oracle receipts. Journey, transcript, stdout, duration, tokens, and cost are diagnostic only.
- Configuration boundary: every harness × model × effort pin has a stable `configuration_id` and separate Overall/API/CLI results; no combined AX Score or Experience Grade. The prototype demonstrates Codex, Claude Code, OpenCode, and two Pi model configurations.
- Cross-configuration context: the lead chart summarizes arithmetic mean and min–max range across published harness × model configurations. The dense table preserves each configuration and surface, so the average never erases model or harness variance.
- Surface boundary: Overall, API, and CLI are separate stored views.
- Status semantics: pass, fail, structural N/A, missing, blocked, and unclassified always carry text or shape in addition to color.
- Evidence path: any leaderboard result opens one vendor report sheet. Task rows disclose all configuration/surface runs and trials 1–3; a trial expands inline instead of loading another report. Static vendor/task/trial routes remain fallback artifacts, not the primary navigation model.
- Prototype safety: the fixed banner, watermark, robots metadata, and `/robots.txt` all identify the fixture as synthetic and non-citable.

## Three directions

### A · Verdict

Bold grotesk headlines, ranked dot plot, and large delta metrics. Optimized for a 30-second launch read.

### B · Evidence Ledger · selected

Warm paper, editorial serif, provenance stamps, and hard ledger rules. The first viewport contains a portable conclusion chart; professional detail is progressively disclosed in an overlay report. This is the canonical `/database/` direction.

### C · Agent Journey

Cool technical canvas and a discovery → authentication → execution → verification track. Optimized for DevRel and product diagnosis.

All three directions use the same validated fixture and benchmark semantics. Ledger now owns the selected interaction model; Verdict and Journey remain visual comparison prototypes.

## Implementation

- Next.js App Router + static export.
- Tailwind v4 is available for composition; durable publication styles live in `app/globals.css` tokens and component classes.
- Native React SVG and `d3-scale` render the dot plot; no general chart bundle.
- Client JavaScript is limited to leaderboard exploration, nested report-sheet state, and shareable query state. Trust pages and static fallback receipts remain server-rendered output.
- System fonts avoid external requests and layout shift.

## Breakpoints

- 1440px: full editorial frame and dense grouped analysis table.
- 1024px: collapsed two-stage hero and horizontally scrollable table with sticky rank/product identity.
- 390px: single-column story, full-width controls, horizontally contained data tables, and two-column receipt journey.
