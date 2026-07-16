# AXArena design system

AXArena uses an **editorial research publication** pattern: a restrained product
hero, dense evidence tables, wide breakout charts, and a readable long-form
methodology. It should feel independent and rigorous without looking like an
academic PDF or a generic SaaS dashboard.

## Visual principles

1. **Outcome first.** Lead with the agent-experience question, then show the
   leaderboard and task matrix before editorial interpretation.
2. **Editorial typography.** Georgia is used for high-impact headings; the
   system sans stack handles interface copy and tables; the monospace stack is
   reserved for labels, scores, ids, and technical metadata.
3. **White canvas, blue identity.** The full page uses a clean white canvas,
   cool gray structure, and restrained blue emphasis. The hero adds a soft blue
   gradient without tinting the rest of the page.
4. **Evidence is interactive.** Product names, matrix cells, and finding ids
   lead to underlying evidence. Color never carries status by itself.
5. **One narrow reading column, wide data breakouts.** Prose tops out near
   680px; leaderboards, matrices, and charts can use the full 1200px frame.

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

Green, amber, and red status tokens remain semantic and must not be replaced by
the blue brand accent.

## Reusable patterns

- **Logo:** a 3×3 evidence-grid mark with three blue cells on the main diagonal.
- **Hero:** large serif question, short definition, three actions, benchmark
  scope card, and the restrained original blue radial light.
- **Section heading:** monospace eyebrow + serif title + optional explanatory
  note aligned on a 1200px frame.
- **Leaderboard:** horizontally scrollable table with plain-language metrics,
  tooltips, numbers, and a visible Draft watermark.
- **Task matrix:** labeled percentage cells, legend, N/A/missing states, and
  evidence links.
- **Research cards:** thin borders, white-to-pale-blue gradient, limited use.
- **Methodology article:** wide introduction, complete SVG pipeline overview,
  sticky table of contents, and a roughly 720px reading column for detail.
- **Launch article:** a narrative 760px column that reuses the canonical SVG
  and links to methodology instead of duplicating formal scoring rules.
- **External source:** inline SVG mark plus visible link text. No CDN icon or
  font dependency.

## Making changes

- Change global color or typography in `styles.css` tokens first; avoid adding
  one-off hex values inside components.
- Change content hierarchy and reusable markup helpers in `app.js`.
- Keep public benchmark values in the versioned JSON dataset. The website must
  not calculate new benchmark truth.
- Preserve Draft behavior, keyboard focus, text labels, table scrolling, and
  print styles.
- Run `npm test` and `node --check app.js site-data.js` after every design edit.
