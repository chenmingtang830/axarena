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
          <div>© 2026 AXArena. Independent benchmark. Placeholder prototype.</div>
          <div>canonical suite · vendor adapters · read-back oracles</div>
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
          <div class="row"><span class="label">Strongest surface</span><span class="value">${Object.entries(vendor.surfaces).sort((a, b) => b[1] - a[1])[0][0].toUpperCase()}</span></div>
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
      <section class="section">
        <div class="section-head"><div><div class="eyebrow">Task suite</div><h2>DAEB-1 canonical tasks</h2></div></div>
        <div class="table-wrap"><table><thead><tr><th>ID</th><th>Task</th><th>Level</th><th>Skill</th></tr></thead><tbody>${taskRows}</tbody></table></div>
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
      <section class="section callout"><h2>Corrections are public.</h2><p>Every factual correction and score-changing rerun belongs in the changelog with links to affected artifacts.</p></section>
    </main>
  `, "independence");
}

function renderChangelog() {
  app.innerHTML = shell(`
    <main class="page">
      ${hero("Corrections Changelog", "Public corrections, reruns, and methodology changes for AXArena benchmarks.", "public record", "")}
      <section class="section panel">
        <div class="eyebrow">2026-07-XX</div>
        <h2>DAEB-1 launch candidate</h2>
        <p>No post-publication corrections yet. Vendor preview feedback and reruns will be recorded here with links to manifest, pack, snapshot, and normalized records.</p>
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
          <p>AXArena is operated by Richard Tang as an independent personal project. It is not affiliated with, endorsed by, or related to his employer.</p>
        </div>
        <div class="panel">
          <h2>Cadence</h2>
          <p>DAEB-1 launches first. DAEB-2 and future category benchmarks should publish with the same suite/adapters/artifacts model.</p>
        </div>
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
