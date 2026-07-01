import { benchmark } from "/data/placeholder.js";

const app = document.querySelector("#app");
const page = document.body.dataset.page || "database";

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function scoreClass(value) {
  if (value === null || value === undefined) return "na";
  if (value >= 75) return "good";
  if (value >= 55) return "mid";
  return "bad";
}

function heat(value) {
  if (value === null || value === undefined) return `<span class="heat na">N/A</span>`;
  return `<span class="heat ${scoreClass(value)}">${value}%</span>`;
}

function panelList(items) {
  return `<ul class="body-list">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function quotePanel(title, text) {
  return `
    <div class="panel">
      <div class="eyebrow">${esc(title)}</div>
      <p class="tight">${esc(text)}</p>
    </div>
  `;
}

function shell(content, active = page) {
  const nav = [
    ["/database/", "Database", "database"],
    ["/methodology/", "Methodology", "methodology"],
    ["/reproduce/", "Reproduce", "reproduce"],
    ["/independence/", "Independence", "independence"],
    ["/changelog/", "Changelog", "changelog"],
    ["/about/", "About", "about"],
  ];
  return `
    <div class="site-shell">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/database/" aria-label="AXArena home">
            <span class="brand-mark" aria-hidden="true">${Array.from({ length: 9 }, () => "<span></span>").join("")}</span>
            <span class="brand-text">AXArena</span>
          </a>
          <nav class="nav">
            ${nav.map(([href, label, key]) => `<a class="${active === key ? "active" : ""}" href="${href}">${label}</a>`).join("")}
          </nav>
        </div>
      </header>
      ${content}
      <footer class="footer">
        <div class="footer-inner">
          <div>© 2026 AXArena. Independent benchmark publication. Placeholder content until DAEB-1 artifacts are frozen.</div>
          <div>canonical suite · vendor adapters · read-back oracles · public corrections</div>
        </div>
      </footer>
    </div>
  `;
}

function hero(title, lede, eyebrow = `${benchmark.name} · ${benchmark.status}`, card = "") {
  return `
    <section class="hero">
      <div>
        <div class="eyebrow">${esc(eyebrow)}</div>
        <h1>${title}</h1>
        <p class="lede">${lede}</p>
      </div>
      ${card}
    </section>
  `;
}

function summaryCard() {
  return `
    <aside class="hero-card">
      <div class="row"><span class="label">Suite</span><span class="value">${esc(benchmark.name)}</span></div>
      <div class="row"><span class="label">Vendors</span><span class="value">${benchmark.summary.vendors}</span></div>
      <div class="row"><span class="label">Tasks</span><span class="value">${benchmark.summary.tasks}</span></div>
      <div class="row"><span class="label">Harnesses</span><span class="value">${benchmark.harnesses.length}</span></div>
      <div class="row"><span class="label">Surfaces</span><span class="value">${benchmark.surfaces.join(" / ")}</span></div>
    </aside>
  `;
}

function leaderboardRows() {
  return benchmark.vendors
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((vendor) => `
      <tr>
        <td class="rank">${vendor.rank}</td>
        <td><a class="vendor-link" href="/database/${vendor.slug}/">${esc(vendor.name)}</a></td>
        <td class="num score">${heat(vendor.overall)}</td>
        <td class="num">${heat(vendor.surfaces.api)}</td>
        <td class="num">${heat(vendor.surfaces.sdk)}</td>
        <td class="num">${heat(vendor.surfaces.cli)}</td>
        <td class="num">${heat(vendor.surfaces.mcp)}</td>
        <td class="num">${vendor.na}</td>
      </tr>
    `).join("");
}

function renderDatabase() {
  const findingPanels = benchmark.findings
    .map((item) => `<div class="panel"><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></div>`)
    .join("");
  const scorecardRows = benchmark.scorecard
    .map((item) => `<tr><td>${esc(item.label)}</td><td>${esc(item.text)}</td></tr>`)
    .join("");
  const content = `
    <main class="page">
      ${hero(
        "Database AX Benchmark V1",
        "AXArena evaluates one canonical database suite across eight vendor adapters. We run real agent harnesses, verify live state with read-back oracles, and publish the gaps.",
        `${benchmark.name} · one suite, eight adapters`,
        summaryCard(),
      )}

      <section class="section grid-3">
        <div class="metric"><div class="num">${benchmark.summary.vendors}</div><div class="caption">database vendors</div></div>
        <div class="metric"><div class="num">${benchmark.summary.tasks}</div><div class="caption">canonical task intents</div></div>
        <div class="metric"><div class="num">${benchmark.summary.cells}</div><div class="caption">surface × harness cells</div></div>
      </section>

      <section class="section twocol">
        <div class="callout">
          <div class="eyebrow">Why this exists</div>
          <h2>AXArena is benchmarking operability, not brochure surface area.</h2>
          <p>${esc(benchmark.framing.mission)}</p>
          <p>${esc(benchmark.framing.whyNow)}</p>
        </div>
        <div class="panel">
          <h3>Publication standard</h3>
          <p>${esc(benchmark.framing.publicationStandard)}</p>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <div class="eyebrow">Leaderboard</div>
            <h2>Placeholder DAEB-1 ranking</h2>
          </div>
          <p class="section-note">${esc(benchmark.summary.note)}</p>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Vendor</th><th class="num">Overall</th><th class="num">API</th><th class="num">SDK</th><th class="num">CLI</th><th class="num">MCP</th><th class="num">N/A</th>
              </tr>
            </thead>
            <tbody>${leaderboardRows()}</tbody>
          </table>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <div class="eyebrow">Early read</div>
            <h2>What the benchmark is designed to make visible</h2>
          </div>
          <p class="section-note">These are placeholder editorial findings for launch-shape only. The final site should tie each claim to frozen records and snapshots.</p>
        </div>
        <div class="grid-3">
          ${findingPanels}
        </div>
      </section>

      <section class="section twocol">
        <div class="callout">
          <div class="eyebrow">Methodology claim</div>
          <h2>Same benchmark contract, vendor-specific verification.</h2>
          <p>DAEB-1 starts from <code>${benchmark.suitePath}</code>. Compiled vendor packs exist only so the executor and verifier can use concrete auth, base URLs, read-back checks, N/A mappings, and surface configs.</p>
          <p>This is the public sentence to keep repeating: vendors do not write their own tests.</p>
        </div>
        <div class="panel">
          <h3>Publication bundle</h3>
          <p>The website should consume <code>${benchmark.bundlePath}</code> plus normalized records and snapshots.</p>
          <div class="artifact-list">
            <span class="pill">manifest.json</span>
            <span class="pill">suite</span>
            <span class="pill">oracle extracts</span>
            <span class="pill">compiled packs</span>
            <span class="pill">snapshots</span>
            <span class="pill">normalized records</span>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <div class="eyebrow">Reading guide</div>
            <h2>How to read DAEB-1</h2>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Layer</th><th>What it means</th></tr></thead>
            <tbody>${scorecardRows}</tbody>
          </table>
        </div>
      </section>
    </main>
  `;
  app.innerHTML = shell(content, "database");
}

function vendorFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[0] === "database" && parts[1] ? parts[1] : "";
}

function renderVendor() {
  const slug = vendorFromPath();
  const vendor = benchmark.vendors.find((item) => item.slug === slug) || benchmark.vendors[0];
  const strongestSurface = Object.entries(vendor.surfaces).sort((a, b) => b[1] - a[1])[0][0].toUpperCase();
  const matrixRows = benchmark.tasks.map((task, index) => `
    <div class="task-name">${task.label} · ${esc(task.title)}</div>
    <div>${heat(vendor.taskScores[index])}</div>
    <div>${esc(task.difficulty)}</div>
    <div>${esc(task.skill)}</div>
    <div>${vendor.naTasks.includes(task.id) ? "N/A disclosed" : "oracle-backed"}</div>
  `).join("");
  const content = `
    <main class="page">
      ${hero(
        esc(vendor.name),
        esc(vendor.posture),
        `${benchmark.name} vendor adapter`,
        `<aside class="hero-card">
          <div class="row"><span class="label">Overall</span><span class="value">${vendor.overall}%</span></div>
          <div class="row"><span class="label">Rank</span><span class="value">#${vendor.rank}</span></div>
          <div class="row"><span class="label">N/A tasks</span><span class="value">${vendor.na}</span></div>
          <div class="row"><span class="label">Strongest surface</span><span class="value">${strongestSurface}</span></div>
        </aside>`,
      )}

      <section class="section grid-3">
        <div class="metric"><div class="num">${vendor.surfaces.api}%</div><div class="caption">API placeholder score</div></div>
        <div class="metric"><div class="num">${vendor.surfaces.cli}%</div><div class="caption">CLI placeholder score</div></div>
        <div class="metric"><div class="num">${vendor.surfaces.mcp}%</div><div class="caption">MCP placeholder score</div></div>
      </section>

      <section class="section twocol">
        <div class="panel">
          <div class="eyebrow">Target / Evidence / Fix</div>
          <h2>Recommendation draft</h2>
          <p><strong>Target:</strong> ${esc(vendor.posture)}</p>
          <p><strong>Evidence:</strong> ${esc(vendor.evidence)}</p>
          <p><strong>Fix:</strong> ${esc(vendor.fix)}</p>
        </div>
        <div class="panel">
          <h3>Artifacts</h3>
          <div class="artifact-list">${vendor.artifacts.map((a) => `<span class="pill">${esc(a)}</span>`).join("")}</div>
          <p style="margin-top:14px">N/A tasks: ${vendor.naTasks.length ? vendor.naTasks.map(esc).join(", ") : "none"}</p>
        </div>
      </section>

      <section class="section grid-3">
        ${quotePanel("Operator read", `In the placeholder set, ${vendor.name} looks strongest when agents can stay inside the ${strongestSurface} path and avoid ambiguous console hops.`)}
        ${quotePanel("What to verify later", "Replace this paragraph with evidence-linked claims backed by snapshot fragments, normalized records, and any public N/A disclosures.")}
        ${quotePanel("Why the page exists", "Vendor pages should not just restate the score. They should explain where the product is agent-friendly, where it breaks, and what concrete fix would improve the benchmark outcome.")}
      </section>

      <section class="section">
        <div class="section-head">
          <div><div class="eyebrow">Task matrix</div><h2>Ten canonical tasks, one vendor adapter</h2></div>
          <p class="section-note">Placeholder task scores show layout only. Real cells should link to snapshot evidence and oracle output.</p>
        </div>
        <div class="matrix">
          <div class="head">Task</div><div class="head">Score</div><div class="head">Level</div><div class="head">Skill</div><div class="head">Status</div>
          ${matrixRows}
        </div>
      </section>
    </main>
  `;
  app.innerHTML = shell(content, "database");
}

function renderMethodology() {
  const taskRows = benchmark.tasks.map((task) => `
    <tr><td><code>${task.label}</code></td><td>${esc(task.title)}</td><td>${esc(task.difficulty)}</td><td>${esc(task.skill)}</td></tr>
  `).join("");
  app.innerHTML = shell(`
    <main class="page">
      ${hero(
        "Methodology",
        "DAEB-1 is one canonical suite plus vendor-specific oracle adapters. The evaluator does not trust transcripts or LLM judges; it reads live product state back after the agent acts.",
        "canonical suite · read-back oracle",
        summaryCard(),
      )}
      <section class="section twocol">
        <div class="callout">
          <h2>One suite, eight adapters.</h2>
          <p>The suite fixes task identity and scoring. Vendor adapters define how each task can be verified in that product: SQL query, REST read path, admin API lookup, N/A mapping, and surface configuration.</p>
          <p>Compiled TargetPacks are executable artifacts, not independent benchmark definitions.</p>
        </div>
        <pre>canonical suite
  -> vendor card
  -> oracle extract
  -> compiled TargetPack
  -> execution
  -> verification
  -> normalized records
  -> leaderboard</pre>
      </section>
      <section class="section twocol">
        <div class="panel">
          <div class="eyebrow">Core principles</div>
          <h2>Methodology commitments</h2>
          ${panelList(benchmark.methodology.principles)}
        </div>
        <div class="panel">
          <div class="eyebrow">Threats to validity</div>
          <h2>What this benchmark does not hide</h2>
          ${panelList(benchmark.methodology.limits)}
        </div>
      </section>
      <section class="section">
        <div class="section-head"><div><div class="eyebrow">Task suite</div><h2>DAEB-1 canonical tasks</h2></div></div>
        <div class="table-wrap"><table><thead><tr><th>ID</th><th>Task</th><th>Level</th><th>Skill</th></tr></thead><tbody>${taskRows}</tbody></table></div>
      </section>
      <section class="section twocol">
        <div class="panel">
          <div class="eyebrow">Scoring posture</div>
          <h2>Scores should describe completed work, not persuasive transcripts.</h2>
          <p>The site should explain that a benchmark cell is earned when the agent leaves behind the intended product state and the verifier can read it back. Transcript quality can help diagnose why something failed, but it should not substitute for state verification.</p>
        </div>
        <div class="panel">
          <div class="eyebrow">N/A policy</div>
          <h2>Structural mismatch belongs in the open.</h2>
          <p>When a canonical task does not map fairly to a vendor, AXArena should disclose that explicitly at the task level, preserve the reasoning in the adapter, and render it on the vendor page instead of burying it in internal notes.</p>
        </div>
      </section>
    </main>
  `, "methodology");
}

function renderReproduce() {
  app.innerHTML = shell(`
    <main class="page">
      ${hero(
        "Reproduce DAEB-1",
        "AXArena publishes claims on the website, proofs in the repo, and reruns through the tool. The publication bundle is the bridge.",
        "publication bundle",
        summaryCard(),
      )}
      <section class="section twocol">
        <div>
          <h2>Freeze the bundle</h2>
          <pre>npm run ax-eval -- publication-bundle \\
  --suite targets/suites/daeb-1.yaml \\
  --vendors supabase,neon,planetscale,mongodb-atlas,turso,convex,insforge,cockroachdb \\
  --run-dir results/runs/daeb-1 \\
  --out results/publications/daeb-1</pre>
        </div>
        <div class="panel">
          <h3>Manifest includes</h3>
          <p>Canonical suite, vendor cards, oracle extracts, compiled packs, approvals, snapshots, normalized records, and competitive report links.</p>
        </div>
      </section>
      <section class="section twocol">
        <div class="panel">
          <div class="eyebrow">Prerequisites</div>
          <h2>What a clean rerun needs</h2>
          ${panelList(benchmark.reproduce.prerequisites)}
        </div>
        <div class="panel">
          <div class="eyebrow">Reproduction model</div>
          <h2>Three stages</h2>
          ${benchmark.reproduce.stages.map((stage) => `<p><strong>${esc(stage.title)}:</strong> ${esc(stage.body)}</p>`).join("")}
        </div>
      </section>
      <section class="section">
        <h2>Rerender from frozen artifacts</h2>
        <pre>npm run ax-eval -- render-generated \\
  --snapshot results/publications/daeb-1/vendors/supabase/generated-eval.snapshot.json \\
  --html /tmp/supabase.html

npm run ax-eval -- competitive \\
  --results results/publications/daeb-1/vendors/*/normalized/*.normalized.json \\
  --html /tmp/daeb-1.html</pre>
      </section>
    </main>
  `, "reproduce");
}

function renderIndependence() {
  app.innerHTML = shell(`
    <main class="page">
      ${hero(
        "Independence Charter",
        "A benchmark is only as useful as the trust behind it. These commitments are part of the methodology, not footnotes.",
        "vendor-neutral by design",
        "",
      )}
      <section class="section grid-3">
        <div class="panel"><h3>No vendor funding</h3><p>AXArena does not accept funding, sponsorship, or in-kind compensation from listed vendors.</p></div>
        <div class="panel"><h3>No purchasable rank</h3><p>No score, rank, framing, or correction is purchasable or modifiable by payment.</p></div>
        <div class="panel"><h3>No veto</h3><p>Vendors receive factual preview, not editorial control.</p></div>
      </section>
      <section class="section twocol">
        ${benchmark.independence.commitments.map((item) => `<div class="panel"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div>`).join("")}
      </section>
      <section class="section callout"><h2>Corrections are public.</h2><p>Every factual correction and score-changing rerun belongs in the changelog with links to affected artifacts.</p></section>
    </main>
  `, "independence");
}

function renderChangelog() {
  app.innerHTML = shell(`
    <main class="page">
      ${hero("Corrections Changelog", "Public corrections, reruns, and methodology changes for AXArena benchmarks.", "public record", "")}
      <section class="section panel">
        <h2>Change policy</h2>
        <p>This log should record every score-affecting rerun, factual correction, and methodology change that matters for public interpretation. The goal is not just transparency at launch, but a durable audit trail after launch.</p>
      </section>
      <section class="section">
        ${benchmark.changelog.map((entry) => `
          <div class="panel changelog-item">
            <div class="eyebrow">${esc(entry.date)}</div>
            <h2>${esc(entry.title)}</h2>
            <p>${esc(entry.text)}</p>
          </div>
        `).join("")}
      </section>
    </main>
  `, "changelog");
}

function renderAbout() {
  app.innerHTML = shell(`
    <main class="page">
      ${hero("About AXArena", "AXArena is an independent benchmark publication for Agent Experience: whether software products can actually be operated by AI agents.", "operator transparency", "")}
      <section class="section twocol">
        <div class="panel">
          <h2>Named operator</h2>
          <p>${esc(benchmark.about.operator)}</p>
        </div>
        <div class="panel">
          <h2>Cadence</h2>
          <p>DAEB-1 launches first. DAEB-2 and future category benchmarks should publish with the same suite/adapters/artifacts model.</p>
        </div>
      </section>
      <section class="section twocol">
        <div class="panel">
          <h2>Disclosure</h2>
          <p>${esc(benchmark.about.disclosure)}</p>
        </div>
        <div class="panel">
          <h2>Project direction</h2>
          <p>${esc(benchmark.about.positioning)}</p>
        </div>
      </section>
      <section class="section callout">
        <div class="eyebrow">What this site should become</div>
        <h2>A public benchmark record, not just a homepage.</h2>
        <p>The long-term shape is a website that renders frozen artifacts, explains the methodology in plain language, discloses uncertainty, and makes reruns legible to outsiders who were not in the room when the benchmark was built.</p>
      </section>
    </main>
  `, "about");
}

if (page === "database-vendor") renderVendor();
else if (page === "methodology") renderMethodology();
else if (page === "reproduce") renderReproduce();
else if (page === "independence") renderIndependence();
else if (page === "changelog") renderChangelog();
else if (page === "about") renderAbout();
else renderDatabase();
