# AXArena design system

AXArena uses an **editorial research publication** pattern: a restrained product
hero, dense evidence tables, wide breakout charts, and a readable long-form
methodology. It should feel independent and rigorous without looking like an
academic PDF or a generic SaaS dashboard.

## Visual principles

1. **Outcome first.** Lead with the agent-experience question, then show the
   benchmark results and task matrix before editorial interpretation.
2. **Editorial typography.** Georgia is used for high-impact headings; the
   system sans stack handles interface copy and tables; the monospace stack is
   reserved for labels, scores, ids, and technical metadata.
3. **White canvas, blue identity.** The full page uses a clean white canvas,
   cool gray structure, and restrained blue emphasis. The hero adds a soft blue
   gradient without tinting the rest of the page.
4. **Evidence is interactive.** Product names, matrix cells, and finding ids
   lead to underlying evidence. Color never carries status by itself.
5. **One narrow reading column, wide data breakouts.** Prose tops out near
   680px; benchmark tables, matrices, and charts can use the full 1200px frame.

## Design tokens

All palette changes belong in the `:root` block of `styles.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#fff` | Page and component background |
| `--soft` | `#f5f6f8` | Quiet panels and table headers |
| `--ink` | `#121318` | Primary text and strong borders |
| `--muted` | `#5f6470` | Secondary text |
| `--faint` | `#e3e5ea` | Dividers and chart tracks |
| `--accent` | `#3157d5` | Links, labels, bars, and emphasis |
| `--accent-blue` | `#3157d5` | Cool side of the brand spectrum |
| `--accent-blue-light` | `#7892ef` | Light end of blue diagrams |
| `--accent-soft` | `#dce4ff` | Stronger blue highlight |
| `--accent-pale` | `#f3f5ff` | Hover and card gradients |
| `--code-bg` | `#17181e` | Dark command-block background |
| `--code-line` | `#262833` | Dark command-block border |
| `--radius` | `14px` | Card, table, and panel corner radius |
| `--radius-sm` | `8px` | Cell and chip corner radius |
| `--shadow-sm` | small layered shadow | Resting elevation for interactive surfaces |
| `--shadow-md` | larger layered shadow | Raised elevation for cards and code blocks |
| `--ease` | `cubic-bezier(.2,.6,.2,1)` | Standard motion curve |

Green, amber, and red status tokens remain semantic and must not be replaced by
the blue brand accent.

## Reusable patterns

- **Logo:** a 3×3 evidence-grid mark with three blue cells on the main diagonal.
- **Hero:** large serif question, short definition, three actions, benchmark
  scope card, and the restrained original blue radial light. Hero copy and the
  scope card rise gently on load.
- **Section heading:** monospace eyebrow with a two-digit report number + serif
  title + optional explanatory note aligned on a 1200px frame.
- **One-minute brief:** four quotable fact cards (what, how, rank basis, what
  it is not) plus the anatomy diagram of one evaluation cell: agent harness →
  product sandbox → independent read-back, with the dashed three-trial loop.
  Draft copy covers scope and method only, never ranking conclusions.
- **Fairness strip:** one pill row above the benchmark table — canonical tasks →
  reviewed adapters → harnesses → trials per cell → live read-back.
- **Vendor logos:** official brand SVG marks in `assets/logos/<vendor>.svg`
  (simple-icons where available; vendor-site marks otherwise, with
  light-theme variants rebuilt for dark-mode-only assets). Identity markers
  only; never recolor them into status hues. Used in the benchmark table,
  charts, matrix headers, and evidence accordion. Unknown vendors degrade
  to name-only.
- **On-this-page rail:** fixed section index with scroll-spy, shown only on
  viewports ≥1560px where the 1200px frame leaves a usable margin; hidden
  in print.
- **Agent leaderboards (Section 02):** Codex and Claude Code remain separate,
  side-by-side rankings. A segmented control switches Overall / API / CLI;
  Overall macro-averages the product's participating surface scores. Every row
  shows average pass@1 and pass³ as `x% (y/z)`.
- **Task drill-down (Section 03):** selecting a vendor in either leaderboard
  reveals task × surface × three-trial evidence for both agents, plus
  operational context that is explicitly excluded from rank. Tables remain
  horizontally scrollable on narrow screens and N/A is always textual.
- **Research cards:** thin borders, rounded corners, white-to-pale-blue
  gradient, limited use; they lift slightly on hover.
- **Vendor evidence:** accordion rows with pill scores and a rotating chevron;
  the open state fills the pill with the accent color.
- **Participation:** a five-step flow (target pack → adapter review →
  maintainer-run trials → read-back → frozen export). No self-reported scores
  or purchasable placement, ever.
- **Motion:** small `transform`/`opacity` transitions and entrance animations
  using `--ease`, always guarded by `prefers-reduced-motion: no-preference`
  and disabled in print.
- **Methodology article:** wide introduction, complete SVG pipeline overview,
  sticky table of contents, failure-path funnel, reproduction commands,
  independence principles, and a roughly 720px reading column for detail.
- **Launch article:** a narrative 760px column that links to methodology instead
  of duplicating formal scoring rules or pipeline diagrams.
- **External source:** inline SVG mark plus visible link text. No CDN icon or
  font dependency.

## Page responsibilities

Keep the three public pages distinct so visitors always know which lens they
are reading:

- **Home (`/database/`):** the value proposition, one-minute brief, benchmark
  results, task matrix, findings, and calls to action. It summarizes method
  and trust but links to Methodology for the full explanation.
- **Methodology (`/methodology/`):** the single source of truth for how
  products are selected, tasks are defined, trials are run, success is
  verified, scores are computed, results are reproduced, and independence is
  guaranteed.
- **Blog (`/blog/introducing-axarena/`):** narrative and editorial perspective.
  It explains why the benchmark matters, not how the numbers are calculated.

## Making changes

- Change global color or typography in `styles.css` tokens first; avoid adding
  one-off hex values inside components.
- Change content hierarchy and reusable markup helpers in `app.js`.
- Keep public benchmark values in the versioned JSON dataset. The website must
  not calculate new benchmark truth. The in-code agent trial fixture is a
  draft interaction prototype only and must be replaced by the frozen
  normalized-result export before publication readiness can pass.
- Preserve Draft behavior, keyboard focus, text labels, table scrolling, and
  print styles.
- Run `npm test` and `node --check app.js site-data.js` after every design edit.
