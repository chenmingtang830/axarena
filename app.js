import { DATA_ROOT, loadDataset, validateDataset } from "/site-data.js";

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
  if (parts[0] === "database" && parts[1]) {
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
  const gradientId = `bar-gradient-${metric}`;
  const bars = rows.map((row, index) => {
    const value = row[metric] ?? 0;
    const y = 42 + index * rowHeight;
    const barWidth = Math.max(2, value * chartWidth);
    return `<g>
      <text x="0" y="${y + 18}" class="chart-label">${esc(vendorName(row.vendor))}</text>
      <rect x="${left}" y="${y}" width="${chartWidth}" height="24" rx="4" class="chart-track" />
      <rect x="${left}" y="${y}" width="${barWidth}" height="24" rx="4" class="chart-bar" style="animation-delay:${index * 80}ms" />
      <text x="${Math.min(left + barWidth + 10, width - 42)}" y="${y + 18}" class="chart-value">${pct(value)}</text>
    </g>`;
  }).join("");
  return `<figure class="wide-figure"><figcaption>${esc(label)}</figcaption>
    <svg class="bar-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}" style="--bar-fill:url(#${gradientId})">
      <defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--accent-blue)"/><stop offset="1" stop-color="var(--accent-blue-light)"/></linearGradient></defs>${bars}</svg>
  </figure>`;
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
    return `<details id="vendor-${esc(row.vendor)}"><summary><span>${esc(vendorName(row.vendor))}</span><span class="summary-meta"><strong class="vendor-score">${pct(row.intersection_score)} AX Score</strong><i class="chevron" aria-hidden="true"></i></span></summary>
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
    { x: 954, number: "05", label: "PUBLISH", title: "Release the evidence", lines: ["Frozen sanitized export", "AX Score and drill-downs"] },
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
    "  --out data/axarena-database-v1",
  ].join("\n"))}</code></pre>`;
}

function navigation(page) {
  return `<nav aria-label="Primary navigation">
    <a href="/database/#results">Leaderboard</a>
    <a href="/database/#task-matrix">Task matrix</a>
    <a href="/methodology/"${page === "methodology" ? ` aria-current="page"` : ""}>Methodology</a>
    <a href="/blog/introducing-axarena/"${page === "blog" ? ` aria-current="page"` : ""}>Blog</a>
    <a href="/database/#about">About</a>
  </nav>`;
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
  const { publication, leaderboard } = data;
  const benchmarkName = publication.display_name ?? "AXArena Database";
  const rankedProducts = leaderboard.rows.filter((row) => row.status === "ranked").length;
  const content = `<main>
    <header class="article-hero blog-hero"><span class="eyebrow">Introducing AXArena</span><h1>Benchmarking Agent Experience</h1><p>AI agents are becoming software users. We need a neutral way to measure whether products are actually usable by them.</p><div class="blog-meta"><span>AXArena Team</span><span>July 14, 2026</span><span>Draft · 8 min read</span></div><div class="hero-actions"><a class="primary" href="/database/#results">View Database leaderboard</a><a href="/methodology/">Read the methodology</a>${githubLink("View ax-eval on GitHub")}</div></header>
    ${!ready && validationErrors.length ? `<aside class="validation-note"><strong>Draft validation:</strong> ${validationErrors.map(esc).join(" · ")}</aside>` : ""}
    <article class="blog-article">
      <p class="blog-dek">Most software evaluation still assumes the user is a person reading documentation, choosing an endpoint, and recovering from mistakes. Agents encounter the same product very differently. They must discover an interface, understand authentication, select a surface, execute work, and verify that it actually happened.</p>

      <section><span class="eyebrow">The shift</span><h2>Agents are becoming users of software</h2><p>APIs, CLIs, SDKs, and MCP servers are no longer only developer artifacts. They are interfaces that agents must find and operate under incomplete context. Publishing an interface is therefore not the same as making it usable by an agent.</p><p>An endpoint can be technically correct while remaining hard to discover. A CLI can be powerful while authentication prevents an autonomous workflow. An agent can produce a convincing transcript while never creating the requested state.</p><blockquote>Agent-facing surfaces need integration tests, not just publication checks.</blockquote></section>

      <section><span class="eyebrow">Our position</span><h2>We measure agent experience—not product quality</h2><p>AXArena is a neutral, open-source agent usability benchmark. It helps developers understand which products are genuinely agent-friendly, especially across API, CLI, and discoverability.</p><p>A ranking is not a verdict on the product as a whole. Products serve different users, markets, and technical constraints. AXArena asks a narrower question: when an agent is given a real goal, how reliably can it discover the path, complete the work, and prove the outcome?</p><div class="blog-principles"><article><strong>Discover</strong><span>Can the agent find the authoritative interface and authentication path?</span></article><article><strong>Operate</strong><span>Can it complete goal-level work through the declared surface?</span></article><article><strong>Verify</strong><span>Does independent read-back confirm the requested state?</span></article></div></section>

      <section><span class="eyebrow">First vertical</span><h2>Why start with databases?</h2><p>Databases expose a useful cross-section of agent experience: control-plane operations, schema inspection, queries, record writes, access control, multiple interfaces, and outcomes that can be verified precisely. They are foundational infrastructure, but their agent-facing paths vary substantially.</p><p>${benchmarkName} is our first public benchmark. The current benchmark contract covers ${publication.scope.core_task_count} core tasks across ${publication.scope.surfaces.map((surface) => surface.toUpperCase()).join(" and ")}, using ${publication.scope.harnesses.length} agent harnesses and ${publication.scope.trial_count} isolated trials per required cell.</p><div class="blog-stats"><div><strong>${publication.cohort.length}</strong><span>products</span></div><div><strong>${publication.scope.core_task_count}</strong><span>core tasks</span></div><div><strong>${publication.scope.surfaces.length}</strong><span>surfaces</span></div><div><strong>${publication.scope.trial_count}</strong><span>trials</span></div></div></section>

      <section class="blog-diagram"><span class="eyebrow">How it works</span><h2>One contract, product-specific paths</h2><p>We define product-neutral outcomes before execution, then compile the vendor-specific details needed to run and verify the same intent fairly. Missing evidence, blocked cells, and incomplete trials remain visible.</p>${methodologyDiagram()}<p class="blog-method-link"><a class="text-link" href="/methodology/">Read the complete methodology →</a></p></section>

      <section><span class="eyebrow">The public record</span><h2>Scores should lead back to evidence</h2><p>AX Score summarizes verified success only on comparable core work shared across the cohort. Reliability captures whether that success repeats across all required trials. Coverage, product-specific task success, surface breakdowns, and discoverability remain separate so one number does not erase important product differences.</p><p>The first website experience includes a leaderboard, task matrix, product evidence drill-downs, downloadable JSON, limitations, and a public corrections log. In the current draft, ${rankedProducts} products have illustrative rows; those values are not citable until the frozen production export passes every quality gate.</p></section>

      <section><span class="eyebrow">Open source</span><h2>The evaluation engine is available to everyone</h2><p>AXArena is powered by <code>ax-eval</code>, our open-source, CLI-first evaluation engine. It turns product specifications and documentation into reviewed task packs, executes real agent harnesses across API, CLI, SDK, and MCP surfaces, verifies live state, and exports normalized evidence.</p><p>Open infrastructure matters because benchmark trust should not depend on a private scoring script. Developers should be able to inspect the contract, reproduce the pipeline, challenge assumptions, and contribute improvements.</p>${githubLink("Explore ax-eval on GitHub", "button primary")}</section>

      <section><span class="eyebrow">What comes next</span><h2>A benchmark should improve with the ecosystem</h2><p>Database is the first AXArena vertical, not the final definition of agent experience. Future work can expand product categories, surfaces, harnesses, and task families while preserving the same core commitments: canonical outcomes, human review, real execution, independent verification, explicit N/A, and evidence-linked publication.</p><p>We welcome factual corrections, methodology discussion, and open-source contributions. What we will not offer is purchasable placement, hidden score suppression, or vendor-authored benchmark tasks.</p><div class="blog-cta"><div><span class="eyebrow">Start with the evidence</span><h3>Explore AXArena Database</h3></div><div><a class="button primary" href="/database/#results">View leaderboard</a><a class="button" href="/methodology/">Read methodology</a></div></div></section>
    </article>
  </main>`;
  app.innerHTML = shell(content, ready, "blog");
  revealHashTarget();
  document.title = "Introducing AXArena: Benchmarking Agent Experience";
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
    const data = await loadDataset();
    const validation = validateDataset(data);
    if (document.body.dataset.page === "methodology") renderMethodology(data, validation.ready, validation.errors);
    else if (document.body.dataset.page === "blog") renderBlog(data, validation.ready, validation.errors);
    else renderDatabase(data, validation.ready, validation.errors);
  } catch (error) {
    const page = document.body.dataset.page === "methodology" ? "methodology" : document.body.dataset.page === "blog" ? "blog" : "database";
    app.innerHTML = shell(`<main class="error-state"><span class="eyebrow">Data error</span><h1>The benchmark export could not be rendered.</h1><p>${esc(error instanceof Error ? error.message : error)}</p><p>Check the versioned JSON files under <code>${esc(DATA_ROOT)}</code>. The site will not display a partial or silently recomputed ranking.</p></main>`, false, page);
  }
}

start();
