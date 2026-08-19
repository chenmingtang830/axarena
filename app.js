import { DATA_ROOT, RELEASE_DATA_ROOT, loadDataset, loadReleaseDataset, rankReleaseVendors, validateDataset, validateReleaseDataset } from "/site-data.js?v=20260819-2";

const app = document.querySelector("#app");
const GITHUB_URL = "https://github.com/chenmingtang830/ax-eval";
const legacySections = new Map([
  ["reproduce", "reproduce"],
  ["independence", "independence"],
  ["changelog", "changelog"],
  ["about", "about"],
]);
const displayNames = {
  neon: "Neon",
  cockroachdb: "CockroachDB",
  turso: "Turso",
  supabase: "Supabase",
  insforge: "Insforge",
  nile: "Nile",
};

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");
const pct = (value) => value === null || value === undefined ? "—" : `${Math.round(value * 100)}%`;
const seconds = (value) => value === null || value === undefined ? "—" : `${(value / 1000).toFixed(1)}s`;
const money = (value) => value === null || value === undefined ? "—" : `$${Number(value).toFixed(3)}`;
const vendorName = (slug) => displayNames[slug] ?? slug;

function githubIcon() {
  return `<svg class="github-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .7C5.7.7.6 5.8.6 12.1c0 5 3.2 9.3 7.7 10.8.6.1.8-.3.8-.6v-2.1c-3.1.7-3.8-1.3-3.8-1.3-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.8-1.5-2.5-.3-5.2-1.3-5.2-5.6 0-1.2.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.9 5 19 5.3 19 5.3c.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.1 0 4.3-2.6 5.2-5.2 5.5.4.4.8 1.1.8 2.2V22c0 .3.2.7.8.6a11.5 11.5 0 0 0 7.7-10.8C23.4 5.8 18.3.7 12 .7Z"/></svg>`;
}

function githubLink(label, className = "") {
  return `<a class="github-link ${esc(className)}" href="${GITHUB_URL}" aria-label="${esc(label)}">${githubIcon()}<span>${esc(label)}</span></a>`;
}

function arenaMark() {
  return `<span class="brand-mark" aria-hidden="true">${Array.from({ length: 9 }, () => "<span></span>").join("")}</span>`;
}

function redirectLegacyRoute() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] === "database" && parts[1] && parts[1] !== "technical-report") {
    location.replace(`/database/#vendor-${encodeURIComponent(parts[1])}`);
    return true;
  }
  const section = legacySections.get(document.body.dataset.page);
  if (section) {
    location.replace(`/database/#${section}`);
    return true;
  }
  return false;
}

function section(id, eyebrow, title, body, note = "", className = "") {
  return `<section class="report-section ${esc(className)}" id="${esc(id)}">
    <header class="section-heading">
      <div><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2></div>
      ${note ? `<p>${esc(note)}</p>` : ""}
    </header>
    ${body}
  </section>`;
}

function scoreBadge(value, label = "") {
  if (value === null || value === undefined) return `<span class="score-badge na">—${label ? ` ${esc(label)}` : ""}</span>`;
  const tone = value >= 0.8 ? "good" : value >= 0.6 ? "mid" : "low";
  return `<span class="score-badge ${tone}">${pct(value)}${label ? ` <small>${esc(label)}</small>` : ""}</span>`;
}

function rankChart(rows, metric, label) {
  const width = 1080;
  const rowHeight = 58;
  const left = 170;
  const chartWidth = 820;
  const height = rows.length * rowHeight + 58;
  const bars = rows.map((row, index) => {
    const value = row[metric] ?? 0;
    const y = 42 + index * rowHeight;
    const barWidth = Math.max(2, value * chartWidth);
    return `<g>
      <text x="0" y="${y + 18}" class="chart-label">${esc(vendorName(row.vendor))}</text>
      <rect x="${left}" y="${y}" width="${chartWidth}" height="24" rx="4" class="chart-track" />
      <rect x="${left}" y="${y}" width="${barWidth}" height="24" rx="4" class="chart-bar" />
      <text x="${Math.min(left + barWidth + 10, width - 42)}" y="${y + 18}" class="chart-value">${pct(value)}</text>
    </g>`;
  }).join("");
  return `<figure class="wide-figure"><figcaption>${esc(label)}</figcaption>
    <svg class="bar-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">${bars}</svg>
  </figure>`;
}

function summaryMetrics(publication, rows) {
  const passes = rows.reduce((total, row) => total + row.outcome_metrics.j01.pass, 0);
  const planned = rows.reduce((total, row) => total + row.outcome_metrics.j01.planned, 0);
  const atomicPasses = rows.reduce((total, row) => total + row.outcome_metrics.atomic.pass, 0);
  const atomicValid = rows.reduce((total, row) => total + row.outcome_metrics.atomic.valid, 0);
  return { passes, planned, passRate: passes / planned, atomicPasses, atomicValid, atomicRate: atomicPasses / atomicValid, archives: 28, invalid: 0, publication };
}

function releaseStatGrid(metrics) {
  return `<div class="release-stat-grid" aria-label="Release at a glance">
    <article><span>Verified J01 journeys</span><strong>${metrics.passes}/${metrics.planned}</strong><small>${pct(metrics.passRate)} end-to-end completion</small></article>
    <article><span>Atomic diagnostics</span><strong>${metrics.atomicPasses}/${metrics.atomicValid}</strong><small>${pct(metrics.atomicRate)} verified task success</small></article>
    <article><span>Evidence archives</span><strong>${metrics.archives}</strong><small>sanitized final-audit bundles</small></article>
    <article><span>Invalid admitted</span><strong>${metrics.invalid}</strong><small>infra, route, or evidence</small></article>
  </div>`;
}

function stageOverviewChart(rows) {
  const stages = ["discovery", "connect", "operate", "recovery"];
  const totals = Object.fromEntries(stages.map((stage) => [stage, rows.reduce((sum, row) => sum + row.outcome_metrics.j01.stages[stage], 0)]));
  const denominator = rows.reduce((sum, row) => sum + row.outcome_metrics.j01.planned, 0);
  return `<figure class="stage-chart"><figcaption><span>Journey progression</span><strong>Where verified progress drops across all 70 journeys</strong></figcaption>
    <ol>${stages.map((stage, index) => { const value = totals[stage]; return `<li><span>0${index + 1}</span><div><strong>${esc(stage)}</strong><small>${value}/${denominator} journeys</small></div><div class="stage-track"><i style="--stage-width:${Math.round(value / denominator * 100)}%"></i></div><b>${pct(value / denominator)}</b></li>`; }).join("")}</ol>
    <p>Discovery is diagnostic evidence; J01 completion still requires connection, operation read-back, and recovery read-back in the same journey.</p>
  </figure>`;
}

function efficiencyScatter(rows) {
  const width = 920;
  const height = 500;
  const left = 94;
  const right = 60;
  const top = 42;
  const bottom = 72;
  const maxCost = Math.max(...rows.map((row) => row.efficiency_metrics.j01_mean_reported_cost_usd));
  const maxDuration = Math.max(...rows.map((row) => row.efficiency_metrics.j01_mean_duration_ms));
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const points = rows.map((row) => {
    const x = left + row.efficiency_metrics.j01_mean_reported_cost_usd / maxCost * plotWidth;
    const y = top + (1 - row.outcome_metrics.j01.pass_rate) * plotHeight;
    const radius = 8 + row.efficiency_metrics.j01_mean_duration_ms / maxDuration * 12;
    return `<g class="scatter-point"><circle cx="${x}" cy="${y}" r="${radius}"/><text x="${x + radius + 7}" y="${y + 5}">${esc(vendorName(row.vendor))}</text></g>`;
  }).join("");
  const ticks = [0, .25, .5, .75, 1].map((tick) => {
    const x = left + tick * plotWidth;
    const y = top + (1 - tick) * plotHeight;
    return `<path class="scatter-grid" d="M${x} ${top}V${top + plotHeight}"/><text class="scatter-tick" x="${x}" y="${height - 42}">$${(tick * maxCost).toFixed(2)}</text><path class="scatter-grid" d="M${left} ${y}H${left + plotWidth}"/><text class="scatter-tick y" x="${left - 14}" y="${y + 4}">${Math.round(tick * 100)}%</text>`;
  }).join("");
  return `<figure class="scatter-figure"><figcaption><span>Efficiency context</span><strong>Success, reported cost, and duration remain separate dimensions</strong></figcaption><div class="chart-scroll"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Vendor J01 success by mean reported cost; point size represents mean duration">${ticks}<path class="scatter-axis" d="M${left} ${top}V${top + plotHeight}H${left + plotWidth}"/>${points}<text class="scatter-axis-label" x="${left + plotWidth / 2}" y="${height - 8}">Mean reported cost per J01 journey</text><text class="scatter-axis-label y" x="22" y="${top + plotHeight / 2}" transform="rotate(-90 22 ${top + plotHeight / 2})">J01 success rate</text></svg></div><p>Bubble size represents mean end-to-end duration. Efficiency never compensates for an unsuccessful journey.</p></figure>`;
}

function leaderboardTable(rows, draft) {
  return `<div class="table-shell"><table>
    <thead><tr>
      <th>Rank</th><th>Product</th>
      <th><abbr title="Verified success on comparable core tasks and surfaces shared across the cohort">AX Score</abbr></th>
      <th><abbr title="Share of comparable task, surface, and harness units that passed all three trials">Reliability</abbr></th>
      <th><abbr title="Share of the benchmark applicable to this product">Coverage</abbr></th>
      <th>Task success</th><th>API</th><th>CLI</th>
      <th><abbr title="How successfully agents found the authoritative interface and authentication path; not used for rank">Discoverability</abbr></th>
    </tr></thead>
    <tbody>${rows.map((row) => `<tr id="rank-${esc(row.vendor)}">
      <td class="rank">${row.rank ?? "—"}</td>
      <td><a href="#vendor-${esc(row.vendor)}">${esc(vendorName(row.vendor))}</a>${row.status !== "ranked" ? `<span class="incomplete">${esc(row.status)}</span>` : ""}</td>
      <td>${scoreBadge(row.intersection_score)}</td>
      <td>${scoreBadge(row.intersection_consistency_at_3)}</td>
      <td>${pct(row.applicability_coverage)}</td>
      <td>${pct(row.applicable_success_rate)}</td>
      <td>${pct(row.surface_success_rates?.api)}</td>
      <td>${pct(row.surface_success_rates?.cli)}</td>
      <td>${pct(row.discovery_score)}</td>
    </tr>`).join("")}</tbody>
  </table>${draft ? `<div class="table-watermark" aria-hidden="true">PREVIEW</div>` : ""}</div>`;
}

function taskHeatmap(tasks, vendors) {
  const core = tasks.filter((task) => task.kind === "core");
  const header = `<div class="heat-head">Core task</div>${vendors.map((vendor) => `<div class="heat-head">${esc(vendorName(vendor))}</div>`).join("")}`;
  const rows = core.map((task) => {
    const cells = vendors.map((vendor) => {
      const applicable = (task.applicability?.[vendor] ?? []).length > 0;
      const results = (task.results ?? []).filter((result) => result.vendor === vendor && !result.na);
      if (!applicable) return `<div class="heat-cell na" aria-label="${esc(vendorName(vendor))}: not applicable">N/A</div>`;
      if (!results.length) return `<div class="heat-cell missing" aria-label="${esc(vendorName(vendor))}: no result">—</div>`;
      const score = results.filter((result) => result.success).length / results.length;
      const tone = score >= 0.8 ? "good" : score >= 0.6 ? "mid" : "low";
      return `<a class="heat-cell ${tone}" href="#vendor-${esc(vendor)}" aria-label="${esc(vendorName(vendor))}: ${pct(score)}; view evidence">${pct(score)}</a>`;
    }).join("");
    return `<div class="heat-task"><strong>${esc(task.task_id.replace(/^db-/, ""))}</strong><span>${esc(task.title)}</span></div>${cells}`;
  }).join("");
  return `<div class="matrix-legend" aria-label="Task matrix legend"><span><i class="good"></i>80–100%</span><span><i class="mid"></i>60–79%</span><span><i class="low"></i>Below 60%</span><span><i class="na"></i>N/A or missing</span></div><div class="heatmap" style="--vendor-count:${vendors.length}">${header}${rows}</div>`;
}

function findings(editorial, evidence) {
  const byId = new Map(evidence.map((item) => [item.id, item]));
  return `<div class="finding-grid">${editorial.findings.map((finding, index) => `<article class="finding">
    <span class="finding-number">0${index + 1}</span><h3>${esc(finding.title)}</h3><p>${esc(finding.body)}</p>
    <div class="evidence-links">${finding.evidence_refs.map((ref) => {
      const item = byId.get(ref);
      const href = ref.startsWith("leaderboard:") ? `#rank-${ref.split(":")[1]}` : ref.startsWith("task:") ? "#task-matrix" : "#evidence";
      return `<a href="${href}">${esc(item?.id ?? ref)}</a>`;
    }).join("")}</div>
  </article>`).join("")}</div>`;
}

function vendorEvidence(rows, cells, tasks) {
  return `<div class="vendor-evidence">${rows.map((row) => {
    const vendorCells = cells.filter((cell) => cell.vendor === row.vendor);
    const applicableTasks = tasks.filter((task) => task.kind === "core" && (task.applicability?.[row.vendor] ?? []).length > 0);
    return `<details id="vendor-${esc(row.vendor)}"><summary><span>${esc(vendorName(row.vendor))}</span><strong>${pct(row.intersection_score)} AX Score</strong></summary>
      <div class="vendor-detail">
        <p>${esc(vendorName(row.vendor))} is applicable to ${applicableTasks.length}/${tasks.filter((task) => task.kind === "core").length} core tasks in this draft view. Official rank uses only the comparable cohort-wide task and surface set.</p>
        <dl><div><dt>Reliability</dt><dd>${pct(row.intersection_consistency_at_3)}</dd></div><div><dt>Coverage</dt><dd>${pct(row.applicability_coverage)}</dd></div><div><dt>Discoverability</dt><dd>${pct(row.discovery_score)}</dd></div></dl>
        <ul class="cell-list">${vendorCells.map((cell) => `<li><code>${esc(cell.id)}</code><span>${pct(cell.mean_success_rate)} success · ${pct(cell.task_consistency_at_3)} reliable</span></li>`).join("")}</ul>
      </div>
    </details>`;
  }).join("")}</div>`;
}

function pipeline(className = "method-flow") {
  const steps = ["Choose category", "Select products", "Define canonical tasks", "Compile adapters", "Run agent trials", "Verify live state", "Publish evidence"];
  return `<ol class="${esc(className)}">${steps.map((step, index) => `<li><span>0${index + 1}</span>${esc(step)}</li>`).join("")}</ol>`;
}

function methodologyDiagram() {
  const steps = [
    { x: 34, number: "01", label: "SELECT", title: "Choose the field", lines: ["Category definition", "Transparent cohort criteria"] },
    { x: 264, number: "02", label: "DEFINE", title: "Freeze shared work", lines: ["Canonical outcomes", "Core and research tasks"] },
    { x: 494, number: "03", label: "ADAPT", title: "Compile product paths", lines: ["Auth, terms, and surfaces", "Independent read-back checks"] },
    { x: 724, number: "04", label: "RUN + VERIFY", title: "Test real agent use", lines: ["Harness × surface × trial", "Live state decides success"] },
    { x: 954, number: "05", label: "PUBLISH", title: "Release the evidence", lines: ["Frozen sanitized export", "Vendor metrics and drill-downs"] },
  ];
  return `<figure class="methodology-diagram">
    <figcaption><span class="eyebrow">Big picture</span><strong>One benchmark contract, adapted to products and verified against reality.</strong></figcaption>
    <div class="diagram-scroll"><svg viewBox="0 0 1200 500" role="img" aria-labelledby="pipeline-title pipeline-desc">
      <title id="pipeline-title">The complete AXArena evaluation pipeline</title>
      <desc id="pipeline-desc">AXArena selects a category and product cohort, defines canonical tasks, compiles product adapters, runs repeated agent trials, verifies live state, and publishes a frozen evidence bundle.</desc>
      <defs>
        <linearGradient id="pipeline-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--accent-blue)"/><stop offset="1" stop-color="var(--accent-blue-light)"/></linearGradient>
        <marker id="pipeline-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)"/></marker>
      </defs>
      <rect class="diagram-canvas" x="1" y="1" width="1198" height="498" rx="2"/>
      <text class="diagram-overline" x="34" y="54">AXARENA EVALUATION PIPELINE</text>
      <path class="diagram-spectrum" d="M34 82 H1166"/>
      <text class="diagram-phase" x="34" y="114">BENCHMARK DESIGN</text>
      <text class="diagram-phase" x="494" y="114">PRODUCT EVALUATION</text>
      <text class="diagram-phase" x="954" y="114">PUBLIC RECORD</text>
      ${steps.map((step, index) => `<g class="diagram-step">
        <rect x="${step.x}" y="142" width="196" height="236" rx="8"/>
        <circle cx="${step.x + 28}" cy="172" r="13"/><text class="diagram-number" x="${step.x + 28}" y="176">${step.number}</text>
        <text class="diagram-label" x="${step.x + 20}" y="216">${step.label}</text>
        <text class="diagram-title" x="${step.x + 20}" y="252">${step.title}</text>
        ${step.lines.map((line, lineIndex) => `<text class="diagram-copy" x="${step.x + 20}" y="${302 + lineIndex * 27}">${line}</text>`).join("")}
        ${index < steps.length - 1 ? `<path class="diagram-arrow" d="M${step.x + 196} 260 H${step.x + 224}" marker-end="url(#pipeline-arrow)"/>` : ""}
      </g>`).join("")}
      <text class="diagram-footnote" x="34" y="444">Product-neutral intent stays fixed</text><path class="diagram-footline" d="M34 458 H678"/>
      <text class="diagram-footnote" x="724" y="444">Evidence, not self-report</text><path class="diagram-footline warm" d="M724 458 H1166"/>
    </svg></div>
  </figure>`;
}

function reproductionCommands() {
  return `<pre><code>${esc([
    "npm run ax-eval -- publication-bundle \\",
    "  --suite <canonical-suite.yaml> \\",
    "  --run-dir <verified-run-directory> \\",
    "  --out <frozen-publication-bundle> \\",
    "  --effort-profiles medium --required-effort-profiles medium --trial-count 3",
    "",
    "npm run ax-eval -- export-publication \\",
    "  --from <frozen-publication-bundle> \\",
    "  --out data/axarena-database-prepublication-fixture",
  ].join("\n"))}</code></pre>`;
}

function navigation(page) {
  return `<nav aria-label="Primary navigation">
    <a href="/database/#results">Leaderboard</a>
    <a href="/database/technical-report/"${page === "technical-report" ? ` aria-current="page"` : ""}>Technical report</a>
    <a href="/methodology/"${page === "methodology" ? ` aria-current="page"` : ""}>Methodology</a>
    <a href="/blog/introducing-axarena/"${page === "blog" ? ` aria-current="page"` : ""}>Blog</a>
    <a href="${RELEASE_DATA_ROOT}/vendor-summary.json">Data</a>
  </nav>`;
}

function methodologyArticleRelease(publication, methodology) {
  return `<div class="article-layout">
    <aside class="article-toc"><span class="eyebrow">On this page</span><a href="#question">1. Research question</a><a href="#contract">2. Frozen contract</a><a href="#execution">3. Controlled execution</a><a href="#verification">4. Independent verification</a><a href="#aggregation">5. Vendor-first aggregation</a><a href="#validity">6. Validity gates</a><a href="#publication">7. Publication boundary</a><a href="#open-source">Open source</a></aside>
    <article class="methodology-article">
      <section id="question"><span class="step-number">01</span><h2>Ask whether an agent can complete a real database journey</h2><p>The primary unit is the vendor experience. J01 starts at discovery and ends only after connection, an independently verified operation, recovery, and recovery read-back. The six atomic tasks diagnose specific capabilities; they do not inflate the J01 success rate.</p></section>
      <section id="contract"><span class="step-number">02</span><h2>Freeze one task and route contract before admitted runs</h2><p>The five-vendor core, CLI surface, task semantics, model/provider identity, trial count, read-back oracles, and exclusion policy are fixed before publication. Turso remains compatibility evidence outside the core matrix.</p></section>
      <section id="execution"><span class="step-number">03</span><h2>Hold the harness fixed and vary model samples</h2><p>One host harness executes ${methodology.model_strata.length} declared model/provider slices for ${methodology.trial_count} isolated trials per core vendor. Fallback is forbidden unless explicitly disclosed; provider resolution and upstream failures remain in the route ledger.</p></section>
      <section id="verification"><span class="step-number">04</span><h2>Verify product state, not agent narration</h2><p>Programmatic read-back oracles determine task outcomes. Audit archives preserve observations, reconciliation decisions, replacement ledgers, and gate results. Discovery evidence is scored separately so a missing discovery trace does not rewrite later observed stage outcomes.</p></section>
      <section id="aggregation"><span class="step-number">05</span><h2>Rank vendors with a transparent lexicographic rule</h2><p>Every primary row is a vendor. The headline outcome is verified J01 completion over 14 observations per vendor (${methodology.model_strata.length} models × ${methodology.trial_count} trials). Official rank sorts first by J01 success rate, then by lower mean reported J01 cost, then by lower median J01 duration. Vendor slug is only a deterministic final fallback if every published metric is equal.</p><p>This produces an official release ranking without a weighted composite score: efficiency can break a tie, but it can never compensate for a failed journey. Unrounded values determine order; displayed values are rounded.</p></section>
      <section id="validity"><span class="step-number">06</span><h2>Admit only valid evidence</h2><p>Invalid infrastructure, route, or evidence never enters a denominator. The frozen release admits ${publication.sample.atomic_cells} atomic cells and ${publication.sample.j01_sessions} J01 sessions, with zero invalid cells. Failures and transient upstream errors remain visible rather than being silently retried or relabeled.</p></section>
      <section id="publication"><span class="step-number">07</span><h2>Publish a bounded diagnostic claim</h2><p>${esc(methodology.publication_boundary)}</p><p>The site reads a frozen, sanitized export with SHA-256 checksums. It does not read raw run directories or recompute benchmark truth in the browser.</p><div class="report-links"><a href="/database/#results">View vendor results →</a><a href="/database/technical-report/">Read technical report →</a></div></section>
      <section id="open-source"><span class="eyebrow">Open evaluation infrastructure</span><h2>ax-eval powers the evidence pipeline</h2><p><code>ax-eval</code> owns execution contracts, review gates, evidence capture, live-state verification, audits, and deterministic publication exports. AXArena owns benchmark framing and the public presentation.</p>${githubLink("Explore ax-eval on GitHub", "button primary")}</section>
    </article>
  </div>`;
}

function renderMethodologyRelease(data, ready, validationErrors) {
  const content = `<main>
    <header class="article-hero"><span class="eyebrow">AXArena Database 1.0.0 · DAEB V2.4 protocol</span><h1>Fixed harness, multi-model samples, vendor-first results</h1><p>AXArena measures whether agents can discover, operate, and verify database work inside a frozen CLI environment. Vendors are the comparison rows; models and trials are samples.</p><div class="hero-actions"><a class="primary" href="/database/#results">View vendor results</a><a href="/database/technical-report/">Read technical report</a>${githubLink("Inspect ax-eval evidence")}</div></header>
    ${validationErrors.length ? `<aside class="validation-note"><strong>Data validation failed:</strong> ${validationErrors.map(esc).join(" · ")}</aside>` : ""}
    ${methodologyArticleRelease(data.publication, data.methodology)}
  </main>`;
  app.innerHTML = shell(content, ready, "methodology");
  revealHashTarget();
  document.title = "AXArena Database 1.0.0 methodology";
}

function shell(content, ready, page = "database") {
  return `${ready ? "" : `<div class="draft-banner" role="status">Draft — not for citation · illustrative values pending frozen production export</div>`}
    <header class="topbar"><div class="topbar-inner">
      <a class="brand" href="/database/" aria-label="AXArena home">${arenaMark()}<span>AXArena</span></a>
      ${navigation(page)}
    </div></header>
    ${content}
    <footer><div><strong>AXArena</strong> · A neutral, open-source agent usability benchmark</div><div>Evidence generated with ${githubLink("ax-eval on GitHub", "footer-github")}, our open-source evaluation engine.</div></footer>`;
}

function releaseVendorTable(rows) {
  return `<div class="table-block"><div class="table-shell"><table><thead><tr>
    <th>Vendor</th><th><abbr title="Completed connection, operation read-back, and recovery read-back">J01 success</abbr></th>
    <th>Pass / 14</th><th>Mean cost</th><th>Mean end-to-end</th><th>Mean first action</th>
    <th>Direct discovery</th><th>Assisted</th><th>Unresolved</th><th>Atomic diagnostics</th>
  </tr></thead><tbody>${rows.map((row) => {
    const j = row.outcome_metrics.j01;
    const d = row.discovery_metrics;
    const e = row.efficiency_metrics;
    return `<tr id="vendor-${esc(row.vendor)}"><td><strong>${esc(vendorName(row.vendor))}</strong></td>
      <td>${scoreBadge(j.pass_rate)}</td><td>${j.pass}/${j.planned}</td><td>${money(e.j01_mean_reported_cost_usd)}</td>
      <td>${seconds(e.j01_mean_duration_ms)}</td><td>${seconds(e.j01_mean_first_action_latency_ms)}</td>
      <td>${d.modes["direct-success"]}/${d.denominator_j01}</td><td>${d.modes["assisted-discovery"]}/${d.denominator_j01}</td>
      <td>${d.modes.unresolved}/${d.denominator_j01}</td><td>${pct(row.outcome_metrics.atomic.pass_rate)}</td></tr>`;
  }).join("")}</tbody></table></div><p class="table-scroll-note" aria-hidden="true">Scroll horizontally to inspect every metric →</p></div>`;
}

function releaseStageTable(rows) {
  return `<div class="table-block"><div class="table-shell"><table><thead><tr><th>Vendor</th><th>Discovery</th><th>Connect</th><th>Operate</th><th>Recovery</th><th>Upstream errors</th><th>Route entries</th></tr></thead><tbody>${rows.map((row) => {
    const stages = row.outcome_metrics.j01.stages;
    const e = row.efficiency_metrics;
    return `<tr><td>${esc(vendorName(row.vendor))}</td><td>${stages.discovery}/14</td><td>${stages.connect}/14</td><td>${stages.operate}/14</td><td>${stages.recovery}/14</td><td>${e.j01_upstream_errors}</td><td>${e.j01_route_entries}</td></tr>`;
  }).join("")}</tbody></table></div><p class="table-scroll-note" aria-hidden="true">Scroll horizontally to inspect every stage →</p></div>`;
}

function releaseModelTable(rows) {
  return `<div class="table-block"><div class="table-shell"><table><thead><tr><th>Model slice</th><th>Provider</th><th>J01 success</th><th>Pass / 10</th><th>Total cost</th><th>Mean cost</th><th>Median end-to-end</th><th>Median first action</th></tr></thead><tbody>${rows.map((row) => `<tr><td><code>${esc(row.model)}</code></td><td>${esc(row.provider)}</td><td>${scoreBadge(row.j01_success_rate)}</td><td>${row.j01_pass}/${row.j01_planned}</td><td>${money(row.j01_total_reported_cost_usd)}</td><td>${money(row.j01_mean_reported_cost_usd)}</td><td>${seconds(row.j01_median_duration_ms)}</td><td>${seconds(row.j01_median_first_action_latency_ms)}</td></tr>`).join("")}</tbody></table></div><p class="table-scroll-note" aria-hidden="true">Scroll horizontally to inspect every model metric →</p></div>`;
}

function officialLeaderboard(rows, compact = false) {
  return `<div class="official-leaderboard${compact ? " compact" : ""}" role="region" aria-label="Official AXArena Database leaderboard">
    <div class="leaderboard-rule"><strong>Official ranking</strong><span>Verified completion ranks first. Cost and speed break ties.</span><a href="/methodology/#aggregation">How it works →</a></div>
    <div class="leaderboard-head" aria-hidden="true"><span>Rank</span><span>Database</span><span>J01 success</span><span>Passed</span><span>Mean cost</span><span>Median time</span></div>
    <ol>${rows.map((row) => `<li id="rank-${esc(row.vendor)}" class="${row.rank === 1 ? "winner" : ""}">
      <a href="/database/technical-report/#vendor-${esc(row.vendor)}" aria-label="Rank ${row.rank}: ${esc(vendorName(row.vendor))}, ${pct(row.primary_score)} J01 success; view details">
        <span class="leaderboard-rank"><small>#</small>${row.rank}</span>
        <strong>${esc(vendorName(row.vendor))}${row.rank === 1 ? `<em>Best in Database 1.0</em>` : ""}</strong>
        <span class="leaderboard-score">${pct(row.primary_score)}</span>
        <span>${row.outcome_metrics.j01.pass}/${row.outcome_metrics.j01.planned}</span>
        <span>${money(row.tie_break_cost)}</span>
        <span>${seconds(row.tie_break_duration)}</span>
      </a>
    </li>`).join("")}</ol>
  </div>`;
}

function releaseFindings(rows) {
  const leader = rows[0];
  const last = rows.at(-1);
  return `<div class="editorial-findings">
    <article class="finding-lead"><span>01 · The answer</span><strong>${esc(vendorName(leader.vendor))} ranks first.</strong><p>It ties Neon on verified completion, then wins the published efficiency tie-break: ${money(leader.tie_break_cost)} per journey and ${seconds(leader.tie_break_duration)} median completion time.</p></article>
    <article><span>02 · The gap</span><strong>21.4 points separate first and last.</strong><p>${esc(vendorName(leader.vendor))} completed ${leader.outcome_metrics.j01.pass}/14 journeys; ${esc(vendorName(last.vendor))} completed ${last.outcome_metrics.j01.pass}/14 under the same contract.</p></article>
    <article><span>03 · The bottleneck</span><strong>Operating and recovery decide the outcome.</strong><p>Most journeys discover and connect. The ranking separates when agents must change real state, verify it, recover, and verify again.</p></article>
  </div>`;
}

function vendorDossiers(rows) {
  return `<div class="vendor-dossiers"><h3>Inspect each database</h3>${rows.map((row) => {
    const failedSlices = row.model_trial_slices.filter((slice) => slice.j01.status !== "pass");
    const stages = row.outcome_metrics.j01.stages;
    return `<details id="vendor-${esc(row.vendor)}"><summary><span>#${row.rank} ${esc(vendorName(row.vendor))}</span><strong>${row.outcome_metrics.j01.pass}/14 complete</strong></summary><div><dl><span><dt>Operate</dt><dd>${stages.operate}/14</dd></span><span><dt>Recovery</dt><dd>${stages.recovery}/14</dd></span><span><dt>Atomic diagnostics</dt><dd>${pct(row.outcome_metrics.atomic.pass_rate)}</dd></span><span><dt>Mean cost</dt><dd>${money(row.tie_break_cost)}</dd></span></dl><p><strong>Unsuccessful journey samples:</strong> ${failedSlices.map((slice) => `${esc(slice.model)} · trial ${slice.trial}`).join("; ") || "None"}.</p><div class="report-links"><a href="#report-models">Compare model slices →</a><a href="#report-stages">Compare failure stages →</a><a href="${RELEASE_DATA_ROOT}/evidence-index.json">Open evidence index ↗</a></div></div></details>`;
  }).join("")}</div>`;
}

function renderDatabaseRelease(data, ready, validationErrors) {
  const publication = data.publication;
  const rows = rankReleaseVendors(data.vendor_summary.rows);
  const content = `<main>
    <section class="leaderboard-hero" id="results">
      <div class="leaderboard-intro"><span class="eyebrow">Agent Experience · AXArena Database</span><h1>The first public benchmark for database agent experience.</h1><p>Which database can AI agents actually discover and use? <strong>Supabase ranks first.</strong></p></div>
      ${officialLeaderboard(rows)}
      <div class="hero-actions"><a class="primary" href="/database/technical-report/">Read the technical report</a></div>
    </section>
    ${validationErrors.length ? `<aside class="validation-note"><strong>Data validation failed:</strong> ${validationErrors.map(esc).join(" · ")}</aside>` : ""}
    ${section("findings", "What the benchmark found", "The ranking is only the beginning", `${releaseFindings(rows)}${rankChart(rows.map((row) => ({ vendor: row.vendor, value: row.primary_score })), "value", "Verified J01 completion by database")}`)}
    ${section("how-it-works", "How it works", "Real work, independently verified", `<p class="prose lead">A pass requires a complete journey: discover a native path, connect, operate on real state, verify the operation, recover, and verify the recovered state.</p>${pipeline()}<div class="benchmark-scope"><span><strong>5</strong> databases</span><span><strong>7</strong> model routes</span><span><strong>2</strong> trials</span><span><strong>${publication.sample.j01_sessions}</strong> journeys</span></div>`)}
    ${section("research", "Go deeper", "Read the research or inspect the evidence", `<div class="research-links"><a href="/database/technical-report/"><span>Technical report</span><strong>The story, results, failures, and implications</strong><b>Read report →</b></a><a href="/methodology/"><span>Methodology</span><strong>Task contract, ranking rule, and validity boundaries</strong><b>Review method →</b></a><a href="${RELEASE_DATA_ROOT}/vendor-summary.json"><span>Open data</span><strong>Frozen vendor results behind every rank</strong><b>Download JSON ↗</b></a><a href="${RELEASE_DATA_ROOT}/evidence-index.json"><span>Evidence</span><strong>Sanitized audit records and checksums</strong><b>Inspect archive ↗</b></a></div>`, `AXArena Database 1.0 · DAEB V2.4 · evidence tree ${esc(data.checksums.tree_sha256.slice(0, 12))}…`)}
  </main>`;
  app.innerHTML = shell(content, ready, "database");
  revealHashTarget();
  document.title = "What is the best database for AI agents? · AXArena";
}

function technicalReportDownloads() {
  const artifacts = [["publication", "Release identity and sample contract"], ["vendor-summary", "Primary vendor-level results"], ["model-slices", "Supplementary model diagnostics"], ["tasks", "Frozen task family contract"], ["methodology", "Machine-readable methodology"], ["evidence-index", "Sanitized audit archive index"], ["archive-manifest", "Archive disposition and scope"], ["exclusions", "Admission and exclusion ledger"], ["checksums", "SHA-256 integrity inventory"]];
  return `<div class="artifact-list">${artifacts.map(([name, description]) => `<a href="${RELEASE_DATA_ROOT}/${name}.json"><span><strong>${esc(name)}.json</strong><small>${esc(description)}</small></span><b>JSON ↗</b></a>`).join("")}</div>`;
}

function renderTechnicalReport(data, ready, validationErrors) {
  const publication = data.publication;
  const rows = rankReleaseVendors(data.vendor_summary.rows);
  const models = data.model_slices.rows;
  const metrics = summaryMetrics(publication, rows);
  const content = `<main class="technical-report">
    <header class="report-hero editorial"><div><span class="eyebrow">AXArena Research · Technical Report 01</span><h1>What is the best database for AI agents?</h1><p class="report-dek">We put five databases through 70 verified, end-to-end journeys. Supabase ranks first in AXArena Database 1.0, edging Neon on cost after both completed 11 of 14 journeys.</p><div class="blog-meta"><span>AXArena Research</span><span>August 17, 2026</span><span>Technical report · 12 min read</span></div><div class="hero-actions"><a class="primary" href="#report-results">See the ranking</a><button type="button" data-print-report>Print / save PDF</button><a href="${RELEASE_DATA_ROOT}/checksums.json">Verify release</a></div></div><aside class="report-folio"><span>AXArena Database</span><strong>1.0.0</strong><dl><div><dt>Question</dt><dd>Can an agent finish?</dd></div><div><dt>Databases</dt><dd>5</dd></div><div><dt>Journeys</dt><dd>70</dd></div><div><dt>Winner</dt><dd>Supabase</dd></div><div><dt>Protocol</dt><dd>DAEB V2.4</dd></div></dl></aside></header>
    ${validationErrors.length ? `<aside class="validation-note"><strong>Data validation failed:</strong> ${validationErrors.map(esc).join(" · ")}</aside>` : ""}
    <div class="report-layout"><aside class="report-toc"><span class="eyebrow">Contents</span><a href="#report-abstract">Why we built it</a><a href="#report-design">How we tested</a><a href="#report-results">Official ranking</a><a href="#report-stages">Where agents fail</a><a href="#report-models">Model sensitivity</a><a href="#report-efficiency">Cost & speed</a><a href="#report-validity">Limits & next</a><a href="#report-artifacts">Open artifacts</a><a href="#report-citation">Citation</a></aside><article class="report-body">
      <section id="report-abstract"><span class="section-number">01</span><span class="eyebrow">Why we built it</span><h2>Agents are becoming database users. Product pages cannot tell us whether they succeed.</h2><p class="report-lead">Documentation coverage and API availability are inputs, not outcomes. AXArena Database asks a harder question: can an agent find the right path, connect, change real state, prove the change happened, recover, and prove the recovery?</p><p>We built a bounded, reproducible test around that journey. Five databases faced the same task contract under one CLI harness, seven model/provider routes, and two isolated trials. Programmatic read-back—not the agent's own claim—decided every pass.</p>${releaseStatGrid(metrics)}<div class="report-callout"><strong>The result</strong><p>Supabase is the official #1 in Database 1.0. It tied Neon at 11/14 successful journeys, then won the published cost tie-break at ${money(rows[0].tie_break_cost)} versus ${money(rows[1].tie_break_cost)} per journey.</p></div></section>
      <section id="report-design"><span class="section-number">02</span><span class="eyebrow">Study design</span><h2>Hold the execution contract fixed; vary the product and sampled model route.</h2><div class="design-grid"><article><span>Primary unit</span><strong>5 vendors</strong><p>CockroachDB, Insforge, Neon, Nile, and Supabase.</p></article><article><span>Sample strata</span><strong>7 routes × 2 trials</strong><p>Purposeful model/provider samples, not independent population draws.</p></article><article><span>Primary outcome</span><strong>J01 completion</strong><p>Connection, operation read-back, and recovery read-back in one journey.</p></article><article><span>Diagnostics</span><strong>420 atomic cells</strong><p>Six capability tasks per vendor, route, and trial.</p></article></div><p>The task prompts, product scope, route identities, verification predicates, and exclusion policy were frozen before admitted execution. Programmatic live-state read-back, not agent narration, determined pass or failure. Cleanup followed verification.</p><div class="report-links"><a href="/methodology/">Full methodology →</a><a href="${RELEASE_DATA_ROOT}/tasks.json">Task contract →</a><a href="${RELEASE_DATA_ROOT}/exclusions.json">Exclusion ledger →</a></div></section>
      <section id="report-results"><span class="section-number">03</span><span class="eyebrow">Official ranking</span><h2>Supabase ranks first. Neon is a close second.</h2><p>Every database contributes 14 admitted J01 observations. Verified journey success determines rank; mean reported cost breaks equal success rates; median duration breaks any remaining tie. This lexicographic rule keeps efficiency from compensating for failed work.</p>${officialLeaderboard(rows, true)}${releaseFindings(rows)}${vendorDossiers(rows)}</section>
      <section id="report-stages"><span class="section-number">04</span><span class="eyebrow">Where agents fail</span><h2>Finding the database is not the same as finishing the job.</h2><p>Discovery and connection remain comparatively strong. The largest separation appears when an agent must operate on real state and then recover it without losing the evidence chain.</p>${stageOverviewChart(rows)}${releaseStageTable(rows)}</section>
      <section id="report-models"><span class="section-number">05</span><span class="eyebrow">Supplementary sensitivity</span><h2>Model slices reveal sample dependence.</h2><p>These rows pool five vendors only to describe the seven sampled routes. They are not the primary benchmark organization and must not be read as a general model leaderboard.</p>${releaseModelTable(models)}</section>
      <section id="report-efficiency"><span class="section-number">06</span><span class="eyebrow">Efficiency context</span><h2>Success, cost, and latency answer different questions.</h2>${efficiencyScatter(rows)}<p>Reported cost covers the J01 route observations available in the frozen export. Shared gateway-lane atomic cost is intentionally not allocated to vendor rows. Latency includes real upstream behavior observed during admitted runs.</p></section>
      <section id="report-validity"><span class="section-number">07</span><span class="eyebrow">Limits and what comes next</span><h2>An official benchmark ranking, not a universal product verdict.</h2><div class="boundary-grid"><article><h3>Supported</h3><ul><li>Ranking observed agent experience for five vendors in this frozen CLI environment.</li><li>Locating discovery, connection, operation, recovery, cost, and latency friction.</li><li>Recomputing the publication from released normalized artifacts.</li></ul></article><article><h3>Not supported</h3><ul><li>A claim that one database is best for every workload or human developer.</li><li>Claims about API, SDK, MCP, database performance, or production reliability.</li><li>Treating seven model routes or two trials as representative population samples.</li></ul></article></div><p>Future releases can expand surfaces, harnesses, model samples, and vendors. Any scoring-rule change requires a new version; corrections preserve the original observation and publish a reason.</p></section>
      <section id="report-artifacts"><span class="section-number">08</span><span class="eyebrow">Research artifact</span><h2>Follow every public claim back to frozen evidence.</h2><p>The 1.0.0 release includes normalized result tables, 28 sanitized final-audit archives, an archive manifest, exclusions, methodology metadata, and a deterministic SHA-256 inventory. Raw local run trees are intentionally excluded because they may contain sensitive operational context.</p><div class="checksum-card"><span>Publication tree SHA-256</span><code>${esc(data.checksums.tree_sha256)}</code><a href="${RELEASE_DATA_ROOT}/checksums.json">Open checksum inventory</a></div>${technicalReportDownloads()}</section>
      <section id="report-citation"><span class="section-number">09</span><span class="eyebrow">Reproduce and cite</span><h2>A versioned public record.</h2><pre><code>npx tsx ax-arena/benchmark/scripts/summarize-v24-vendor.ts\nnpx tsx ax-arena/benchmark/scripts/export-v24-publication.ts\nnpm test --workspace @ax-arena/benchmark -- --run tests/v24-publication.test.ts</code></pre><div class="citation-block"><span>Suggested citation</span><p>AXArena. “AXArena Database 1.0.0: Can agents complete a real database journey?” Technical Report 01, August 17, 2026. DAEB V2.4 protocol.</p></div><div class="section-actions"><button class="button primary" type="button" data-print-report>Print / save PDF</button>${githubLink("Inspect ax-eval source", "button")}<a class="button" href="/database/">Return to release overview</a></div></section>
    </article></div>
  </main>`;
  app.innerHTML = shell(content, ready, "technical-report");
  document.querySelectorAll("[data-print-report]").forEach((button) => button.addEventListener("click", () => window.print()));
  revealHashTarget();
  document.title = "What is the best database for AI agents? · AXArena Technical Report";
}

function renderDatabase(data, ready, validationErrors) {
  const { publication, leaderboard, cells, tasks, evidence, editorial } = data;
  const rows = leaderboard.rows;
  const vendors = publication.cohort;
  const coreTasks = tasks.tasks.filter((task) => task.kind === "core");
  const researchTasks = tasks.tasks.filter((task) => task.kind === "research");
  const benchmarkName = publication.display_name ?? "AXArena Database";
  const content = `<main>
    <section class="hero" id="top">
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="hero-copy"><span class="eyebrow">AXArena · Agent experience benchmarks</span>
        <h1>${esc(editorial.question)}</h1><p>${esc(editorial.lede)}</p>
        <div class="hero-actions"><a class="primary" href="#results">View Database leaderboard</a>${githubLink("View ax-eval on GitHub")}<a href="/methodology/">Read methodology</a></div>
      </div>
      <aside class="benchmark-card" aria-label="First public benchmark">
        <span class="eyebrow">Our first public benchmark</span><h2>${esc(benchmarkName)}</h2><p>Verified database work across real product interfaces—not marketing breadth or agent self-report.</p>
        <dl class="scope-card"><div><dt>Products</dt><dd>${vendors.length}</dd></div><div><dt>Core tasks</dt><dd>${publication.scope.core_task_count}</dd></div><div><dt>Surfaces</dt><dd>${publication.scope.surfaces.map((x) => x.toUpperCase()).join(" / ")}</dd></div><div><dt>Harnesses</dt><dd>${publication.scope.harnesses.length}</dd></div><div><dt>Trials</dt><dd>${publication.scope.trial_count}</dd></div><div><dt>Version</dt><dd>Database v${publication.suite_version}</dd></div></dl>
      </aside>
    </section>
    ${!ready && validationErrors.length ? `<aside class="validation-note"><strong>Draft validation:</strong> ${validationErrors.map(esc).join(" · ")}</aside>` : ""}
    ${section("results", "AXArena Database · Leaderboard", "Agent experience, ranked by verified work", `<div class="results-intro"><p class="prose lead">AX Score measures verified success on the core task and surface combinations shared across every product. Reliability breaks ties; coverage and discoverability remain visible without changing official rank.</p><a class="text-link" href="/methodology/#scoring">How scoring works →</a></div>${leaderboardTable(rows, !ready)}${rankChart(rows, "intersection_score", "AX Score — verified success on comparable work")}${rankChart(rows, "discovery_score", "Discoverability — reported separately, never ranked")}`, `${leaderboard.ranking_method.intersection_pairs.length} comparable task × surface pairs · ${leaderboard.ranking_method.required_trial_count} trials per required cell`)}
    ${section("task-matrix", "Task performance", "See where products differ", `<p class="prose lead">Every cell shows verified task success. N/A represents a structural product difference, not a hidden failure. Select a score to inspect the product evidence.</p>${taskHeatmap(tasks.tasks, vendors)}`, `${coreTasks.length} scored core tasks · ${researchTasks.length} research tasks outside the official ranking`)}
    ${section("findings", "What the evidence says", "Three findings from the current matrix", findings(editorial, evidence.evidence), "Every claim links to a public leaderboard row, task, or execution cell.")}
    ${section("failure-path", "Agent experience", "Where agents get stuck", `<ol class="funnel"><li><span>01</span><strong>Discovery</strong><p>Find the authoritative surface.</p></li><li><span>02</span><strong>Authentication</strong><p>Identify the correct credential and scope.</p></li><li><span>03</span><strong>Surface choice</strong><p>Choose the appropriate product interface.</p></li><li><span>04</span><strong>Execution</strong><p>Complete the canonical task.</p></li><li><span>05</span><strong>Read-back</strong><p>Verify live product state independently.</p></li></ol>`)}
    ${section("methodology-preview", "Methodology", "From a product category to public evidence", `<p class="prose lead">AXArena defines product-neutral outcomes, adapts them without changing their intent, runs controlled agent trials, and verifies results against live sandbox state.</p>${pipeline()}<div class="section-actions"><a class="button primary" href="/methodology/">Read the full methodology</a><a class="button" href="/methodology/#database-v1">AXArena Database v1 details</a></div>`, "A reusable evaluation pipeline for Database and future AXArena verticals.")}
    ${section("about", "Open source", "Measure agent experience, not product quality", `<div class="open-source-card"><div><span class="eyebrow">Neutral by design · Powered by ax-eval</span><h3>Which products are genuinely agent-friendly?</h3><p>AXArena is a neutral, open-source agent usability benchmark for developers. It measures how successfully agents discover and operate product interfaces—especially APIs and CLIs—without making a broader judgment about whether a product is good or bad.</p><p><code>ax-eval</code> is the open-source CLI and evaluation engine behind the benchmark. It creates reviewed task packs, runs real agents, and verifies outcomes by reading live product state back.</p></div><div class="open-source-actions">${githubLink("View GitHub repository", "button primary")}<a class="button" href="/methodology/#open-source">How the tool fits</a><a class="button" href="${DATA_ROOT}/publication.json">Download benchmark data</a></div></div>`, "AXArena quantifies agent experience; ax-eval generates and verifies the evidence.")}
    ${section("evidence", "Evidence", "Drill from a rank to the underlying cells", `${vendorEvidence(rows, cells.cells, tasks.tasks)}<div class="download-grid"><a href="${DATA_ROOT}/leaderboard.json"><strong>Leaderboard</strong><span>ranking method and rows</span></a><a href="${DATA_ROOT}/cells.json"><strong>Cells</strong><span>surface × harness aggregates</span></a><a href="${DATA_ROOT}/tasks.json"><strong>Tasks</strong><span>applicability and trial evidence</span></a><a href="${DATA_ROOT}/evidence-index.json"><strong>Evidence index</strong><span>stable artifact references</span></a></div>`)}
    ${section("reproduce", "Reproduce", "From frozen bundle to website data", reproductionCommands())}
    ${section("independence", "Independence", "Trust requires visible constraints", `<div class="principles">${editorial.independence.map((item) => `<p>${esc(item)}</p>`).join("")}</div>`)}
    ${section("changelog", "Corrections", "A benchmark is a versioned public record", `<div class="prose"><p><strong>2026-07-14 · Product and methodology update.</strong> Renamed the first vertical AXArena Database, clarified AX Score, and separated the reusable methodology from the leaderboard.</p><p>Every future score-changing correction must identify the affected benchmark version, artifact, reason, and rerun.</p></div>`)}
  </main>`;
  app.innerHTML = shell(content, ready, "database");
  revealHashTarget();
  document.title = `${benchmarkName} · AXArena`;
}

function methodologyArticle(publication, editorial) {
  return `<div class="article-layout">
    <aside class="article-toc"><span class="eyebrow">On this page</span><a href="#category">1. Category and products</a><a href="#canonical-tasks">2. Canonical tasks</a><a href="#freeze">3. Freeze the contract</a><a href="#adapters">4. Product adapters</a><a href="#execution">5. Agent trials</a><a href="#verification">6. Verification</a><a href="#scoring">7. Scoring and publication</a><a href="#database-v1">Database v1</a><a href="#open-source">Open source</a></aside>
    <article class="methodology-article">
      <section id="category"><span class="step-number">01</span><h2>Choose a category and select products</h2><p>AXArena begins with a product category, not a preferred winner. The cohort is selected using declared criteria such as category relevance, publicly documented agent-facing interfaces, a usable sandbox, and enough product surface to execute and independently verify real work.</p><p>Inclusions, exclusions, unavailable surfaces, and blocked access remain part of the public record. Products are not selected or removed because of their measured score.</p></section>
      <section id="canonical-tasks"><span class="step-number">02</span><h2>Define canonical user outcomes</h2><p>We identify common jobs users expect to complete across the category. Tasks describe outcomes—such as inspecting a schema or writing a record—rather than vendor endpoints, command names, or implementation details.</p><p>Each task receives a stable identity, intent, difficulty, core or research status, expected surfaces, and an independently verifiable outcome. Core tasks form the competitive contract; research tasks expose emerging capabilities without changing rank.</p></section>
      <section id="freeze"><span class="step-number">03</span><h2>Review and freeze the benchmark contract</h2><p>The canonical suite is reviewed before competitive execution. Human approval locks the task identity, intent, difficulty, surface scope, and scoring semantics. Editing an approved pack reopens the review gate.</p><p>This prevents the evaluation from quietly changing to fit one product after results are visible.</p></section>
      <section id="adapters"><span class="step-number">04</span><h2>Compile product-specific adapters</h2><p>The same canonical suite is adapted to each product. An adapter may map terminology, authentication, base URLs, supported surfaces, structural N/A cases, and vendor-specific read-back checks. It cannot redefine the user outcome or make the task easier.</p><p>Adapters are execution artifacts, not separate benchmarks. That distinction keeps the comparison centered on shared work while respecting real product differences.</p></section>
      <section id="execution"><span class="step-number">05</span><h2>Run controlled agent trials</h2><p>Agents begin from a cold start with goal-level prompts. They must discover the correct interface and execute inside an isolated sandbox. AXArena records the product, surface, harness, model, effort profile, and trial number for every cell.</p><p>Repeated trials reveal whether success is dependable rather than accidental. Missing trials, blocked authentication, or incomplete cells remain visible and prevent a draft from becoming a citable publication.</p></section>
      <section id="verification"><span class="step-number">06</span><h2>Verify live product state</h2><p>An agent saying “done” is not evidence of success. Independent read-back checks inspect the live sandbox and confirm that the requested outcome exists with the expected properties.</p><p>Execution traces explain how the agent behaved; read-back oracles decide whether the task passed.</p></section>
      <section id="scoring"><span class="step-number">07</span><h2>Normalize, score, and publish</h2><p><strong>AX Score</strong> is verified success over the core task and surface combinations comparable across the full cohort. Each task, surface, harness, and trial outcome is equally weighted. The first tie-break is <strong>Reliability</strong>: the share of comparable task, surface, and harness units passing every required trial.</p><p>Coverage, product-specific task success, API and CLI performance, and Discoverability are disclosed separately. Discoverability and research tasks never alter official rank. Unrounded values determine order; percentages are rounded only for display.</p><p>The website consumes a frozen, sanitized publication export. It never reads raw run directories or recomputes benchmark truth.</p></section>
      <section id="database-v1"><span class="eyebrow">Applied methodology</span><h2>AXArena Database v${publication.suite_version}</h2><p>The first public vertical evaluates ${publication.cohort.length} database products on ${publication.scope.core_task_count} core tasks across ${publication.scope.surfaces.map((item) => item.toUpperCase()).join(" and ")}. ${publication.scope.harnesses.length} agent harnesses run ${publication.scope.trial_count} isolated trials for every required product, surface, and harness cell.</p><p>${esc(editorial.limitations.join(" "))}</p><a class="text-link" href="/database/#results">View the Database leaderboard →</a></section>
      <section id="open-source"><span class="eyebrow">Open evaluation infrastructure</span><h2>ax-eval powers the evidence pipeline</h2><p><code>ax-eval</code> is the open-source, CLI-first engine behind AXArena. It ingests OpenAPI, GraphQL, and documentation surfaces; drafts reviewed task packs; runs agents through API, CLI, SDK, and MCP interfaces; verifies live state; and exports normalized publication records.</p><p>AXArena owns benchmark design, cohort decisions, editorial interpretation, and public presentation. <code>ax-eval</code> owns execution contracts, review gates, evidence capture, verification, and reproducible exports.</p>${githubLink("Explore ax-eval on GitHub", "button primary")}</section>
    </article>
  </div>`;
}

function renderMethodology(data, ready, validationErrors) {
  const { publication, editorial } = data;
  const content = `<main>
    <header class="article-hero"><span class="eyebrow">AXArena methodology</span><h1>How we evaluate agent experience</h1><p>AXArena is a neutral, open-source agent usability benchmark. It quantifies how agents discover, operate, and verify work across product interfaces without judging the product as a whole.</p><div class="hero-actions"><a class="primary" href="/database/#results">View Database leaderboard</a>${githubLink("View ax-eval on GitHub")}</div></header>
    ${!ready && validationErrors.length ? `<aside class="validation-note"><strong>Draft validation:</strong> ${validationErrors.map(esc).join(" · ")}</aside>` : ""}
    <section class="pipeline-overview">${methodologyDiagram()}</section>
    ${methodologyArticle(publication, editorial)}
  </main>`;
  app.innerHTML = shell(content, ready, "methodology");
  revealHashTarget();
  document.title = "Methodology · AXArena";
}

function renderBlog(data, ready, validationErrors) {
  const { publication, methodology, vendor_summary: vendors } = data;
  const benchmarkName = publication.display_name;
  const content = `<main>
    <header class="article-hero blog-hero"><span class="eyebrow">Introducing AXArena Database 1.0.0</span><h1>Benchmarking Agent Experience</h1><p>AI agents are becoming software users. We need a neutral way to measure whether products are actually usable by them.</p><div class="blog-meta"><span>AXArena Team</span><span>August 17, 2026</span><span>Public release · 8 min read</span></div><div class="hero-actions"><a class="primary" href="/database/#results">View vendor results</a><a href="/database/technical-report/">Read technical report</a><a href="/methodology/">Read methodology</a>${githubLink("View ax-eval on GitHub")}</div></header>
    ${validationErrors.length ? `<aside class="validation-note"><strong>Data validation failed:</strong> ${validationErrors.map(esc).join(" · ")}</aside>` : ""}
    <article class="blog-article">
      <p class="blog-dek">Most software evaluation still assumes the user is a person reading documentation, choosing an endpoint, and recovering from mistakes. Agents encounter the same product very differently. They must discover an interface, understand authentication, select a surface, execute work, and verify that it actually happened.</p>

      <section><span class="eyebrow">The shift</span><h2>Agents are becoming users of software</h2><p>APIs, CLIs, SDKs, and MCP servers are no longer only developer artifacts. They are interfaces that agents must find and operate under incomplete context. Publishing an interface is therefore not the same as making it usable by an agent.</p><p>An endpoint can be technically correct while remaining hard to discover. A CLI can be powerful while authentication prevents an autonomous workflow. An agent can produce a convincing transcript while never creating the requested state.</p><blockquote>Agent-facing surfaces need integration tests, not just publication checks.</blockquote></section>

      <section><span class="eyebrow">Our position</span><h2>We measure agent experience—not product quality</h2><p>AXArena is a neutral, open-source agent usability benchmark. It helps developers understand how agents experience real product workflows.</p><p>A benchmark result is not a verdict on the product as a whole. Products serve different users, markets, and technical constraints. AXArena asks a narrower question: when an agent is given a real goal, how reliably can it discover the path, complete the work, and prove the outcome?</p><div class="blog-principles"><article><strong>Discover</strong><span>Can the agent find the authoritative interface and authentication path?</span></article><article><strong>Operate</strong><span>Can it complete goal-level work through the declared surface?</span></article><article><strong>Verify</strong><span>Does independent read-back confirm the requested state?</span></article></div></section>

      <section><span class="eyebrow">First vertical</span><h2>Why start with databases?</h2><p>Databases expose a useful cross-section of agent experience: discovery, connection, queries, state changes, recovery, and outcomes that can be verified precisely. They are foundational infrastructure, but their agent-facing paths vary substantially.</p><p>${benchmarkName} is our first public benchmark release. It holds one CLI harness and the DAEB V${esc(publication.protocol.version)} contract fixed while sampling ${methodology.model_strata.length} model/provider slices across ${methodology.trial_count} trials.</p><div class="blog-stats"><div><strong>${vendors.rows.length}</strong><span>core vendors</span></div><div><strong>${methodology.model_strata.length}</strong><span>model slices</span></div><div><strong>1</strong><span>fixed harness</span></div><div><strong>${methodology.trial_count}</strong><span>trials</span></div></div></section>

      <section class="blog-diagram"><span class="eyebrow">How it works</span><h2>One contract, product-specific paths</h2><p>We define product-neutral outcomes before execution, then compile the vendor-specific details needed to run and verify the same intent fairly. Missing evidence, blocked cells, and incomplete trials remain visible.</p>${methodologyDiagram()}<p class="blog-method-link"><a class="text-link" href="/methodology/">Read the complete methodology →</a></p></section>

      <section><span class="eyebrow">The public record</span><h2>Every rank should lead back to evidence</h2><p>The primary table uses vendors as rows. Verified J01 completion determines official rank; lower mean cost and then lower median duration break ties. Discovery mode, stage completion, and atomic diagnostics remain separate so partial success cannot be mistaken for end-to-end completion.</p><p>Release 1.0.0 contains ${publication.sample.j01_sessions} J01 journeys and ${publication.sample.atomic_cells} atomic cells, plus 28 sanitized final-audit archives and a complete SHA-256 ledger.</p></section>

      <section><span class="eyebrow">Open source</span><h2>The evaluation engine is available to everyone</h2><p>AXArena is powered by <code>ax-eval</code>, our open-source, CLI-first evaluation engine. It turns product specifications and documentation into reviewed task packs, executes real agent harnesses across API, CLI, SDK, and MCP surfaces, verifies live state, and exports normalized evidence.</p><p>Open infrastructure matters because benchmark trust should not depend on a private scoring script. Developers should be able to inspect the contract, reproduce the pipeline, challenge assumptions, and contribute improvements.</p>${githubLink("Explore ax-eval on GitHub", "button primary")}</section>

      <section><span class="eyebrow">What comes next</span><h2>A benchmark should improve with the ecosystem</h2><p>Database is the first AXArena vertical, not the final definition of agent experience. Future work can expand product categories, surfaces, harnesses, model samples, and task families while preserving the same core commitments: frozen outcomes, human review, real execution, independent verification, explicit exclusions, and evidence-linked publication.</p><p>We welcome factual corrections, methodology discussion, and open-source contributions. What we will not offer is purchasable placement, hidden result suppression, or vendor-authored benchmark tasks.</p><div class="blog-cta"><div><span class="eyebrow">Start with the evidence</span><h3>Explore AXArena Database 1.0.0</h3></div><div><a class="button primary" href="/database/technical-report/">Read technical report</a><a class="button" href="/database/#results">View vendor results</a><a class="button" href="/methodology/">Read methodology</a></div></div></section>
    </article>
  </main>`;
  app.innerHTML = shell(content, ready, "blog");
  revealHashTarget();
  document.title = "Introducing AXArena Database 1.0.0";
}

function revealHashTarget() {
  if (!location.hash) return;
  const target = document.querySelector(location.hash);
  if (target instanceof HTMLDetailsElement) target.open = true;
  window.setTimeout(() => {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: "auto" });
  }, 80);
}

async function start() {
  if (redirectLegacyRoute()) return;
  app.innerHTML = `<main class="loading"><p>Loading the frozen benchmark export…</p></main>`;
  try {
    if (document.body.dataset.page !== "blog") {
      const data = await loadReleaseDataset();
      const validation = validateReleaseDataset(data);
      if (document.body.dataset.page === "methodology") renderMethodologyRelease(data, validation.ready, validation.errors);
      else if (document.body.dataset.page === "technical-report") renderTechnicalReport(data, validation.ready, validation.errors);
      else renderDatabaseRelease(data, validation.ready, validation.errors);
      return;
    }
    const data = await loadReleaseDataset();
    const validation = validateReleaseDataset(data);
    if (document.body.dataset.page === "blog") renderBlog(data, validation.ready, validation.errors);
    else renderDatabase(data, validation.ready, validation.errors);
  } catch (error) {
    const page = ["methodology", "blog", "technical-report"].includes(document.body.dataset.page) ? document.body.dataset.page : "database";
    app.innerHTML = shell(`<main class="error-state"><span class="eyebrow">Data error</span><h1>The benchmark export could not be rendered.</h1><p>${esc(error instanceof Error ? error.message : error)}</p><p>Check the versioned JSON files under <code>${esc(DATA_ROOT)}</code>. The site will not display a partial or silently recomputed ranking.</p></main>`, false, page);
  }
}

start();
