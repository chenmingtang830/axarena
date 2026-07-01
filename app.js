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

function externalLink(url, label) {
  return `<a class="inline-link" href="${esc(url)}">${esc(label)}</a>`;
}

function section(id, eyebrow, title, body, note = "") {
  return `
    <section class="section section-block" id="${esc(id)}">
      <div class="section-head">
        <div>
          <div class="eyebrow">${esc(eyebrow)}</div>
          <h2>${title}</h2>
        </div>
        ${note ? `<p class="section-note">${note}</p>` : ""}
      </div>
      ${body}
    </section>
  `;
}

function anchorHref(id) {
  return `/database/#${id}`;
}

function shell(content, active = page) {
  const nav = [
    [anchorHref("tldr"), "TL;DR", "tldr"],
    [anchorHref("abstract"), "Abstract", "abstract"],
    [anchorHref("findings"), "Findings", "findings"],
    [anchorHref("results"), "Results", "results"],
    [anchorHref("methodology"), "Method", "methodology"],
    [anchorHref("reproduce"), "Reproduce", "reproduce"],
    [anchorHref("about"), "About", "about"],
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
          <div>
            canonical suite · vendor adapters · read-back oracles · public corrections ·
            ${externalLink(benchmark.links.engineRepoUrl, benchmark.links.engineRepoLabel)} ·
            ${externalLink(benchmark.links.xUrl, benchmark.links.xHandle)}
          </div>
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
  const reportCard = `
    <aside class="hero-card">
      <div class="row"><span class="label">Report</span><span class="value">${esc(benchmark.name)}</span></div>
      <div class="row"><span class="label">Category</span><span class="value">Database</span></div>
      <div class="row"><span class="label">Status</span><span class="value">${esc(benchmark.status)}</span></div>
      <div class="row"><span class="label">Scope</span><span class="value">${benchmark.summary.vendors} vendors / ${benchmark.summary.tasks} tasks</span></div>
    </aside>
  `;
  const taskRows = benchmark.tasks.map((task) => `
    <tr><td><code>${task.label}</code></td><td>${esc(task.title)}</td><td>${esc(task.difficulty)}</td><td>${esc(task.skill)}</td></tr>
  `).join("");
  const content = `
    <main class="page">
      ${hero(
        esc(benchmark.homepage.title),
        esc(benchmark.homepage.lede),
        benchmark.homepage.eyebrow,
        reportCard,
      )}

      ${section(
        "tldr",
        "TL;DR",
        "A benchmark report should tell the reader the claim before it asks them to inspect the machinery.",
        `
          <div class="twocol">
            <div class="callout">
              ${panelList(benchmark.homepage.tldr)}
            </div>
            <div class="panel">
              <h3>Current note</h3>
              <p>${esc(benchmark.homepage.note)}</p>
            </div>
          </div>
        `,
      )}

      ${section(
        "abstract",
        "Abstract",
        "What this report is about",
        `
          <div class="twocol">
            <div class="callout">
              <p>${esc(benchmark.homepage.abstract)}</p>
            </div>
            <div class="panel">
              <h3>Report question</h3>
              <p>${esc(benchmark.homepage.reportQuestion)}</p>
              <p>${esc(benchmark.homepage.reading)}</p>
            </div>
          </div>
        `,
      )}

      <section class="section grid-3 summary-strip">
        <div class="metric"><div class="num">${benchmark.summary.vendors}</div><div class="caption">vendors in this report</div></div>
        <div class="metric"><div class="num">${benchmark.summary.tasks}</div><div class="caption">shared canonical tasks</div></div>
        <div class="metric"><div class="num">${benchmark.summary.cells}</div><div class="caption">surface × harness observations</div></div>
      </section>

      ${section(
        "findings",
        "Key findings",
        "What this report wants the reader to notice first",
        `
          <div class="twocol">
            <div class="callout">
              <p>${esc(benchmark.framing.mission)}</p>
              <p>${esc(benchmark.framing.whyNow)}</p>
            </div>
            <div class="panel">
              <h3>Publication standard</h3>
              <p>${esc(benchmark.framing.publicationStandard)}</p>
            </div>
          </div>
          <div class="grid-3 section-follow">
            ${findingPanels}
          </div>
        `,
        "These are placeholder editorial findings for launch-shape only. The final site should tie each claim to frozen records and snapshots.",
      )}

      ${section(
        "results",
        "Results",
        "Comparative table",
        `
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
        `,
        esc(benchmark.summary.note),
      )}

      ${section(
        "methodology",
        "Methodology",
        "How to read the numbers",
        `
          <div class="twocol">
            <div class="callout">
              <p>DAEB-1 starts from <code>${benchmark.suitePath}</code>. Compiled vendor packs exist only so the executor and verifier can use concrete auth, base URLs, read-back checks, N/A mappings, and surface configs.</p>
              <p>This is the public sentence to keep repeating: vendors do not write their own tests.</p>
            </div>
            <pre>canonical suite
  -> vendor card
  -> oracle extract
  -> compiled TargetPack
  -> execution
  -> verification
  -> normalized records
  -> leaderboard</pre>
          </div>
          <div class="section-follow table-wrap">
            <table>
              <thead><tr><th>Layer</th><th>What it means</th></tr></thead>
              <tbody>${scorecardRows}</tbody>
            </table>
          </div>
          <div class="section-follow twocol">
            <div class="panel">
              <div class="eyebrow">Core principles</div>
              <h3>Methodology commitments</h3>
              ${panelList(benchmark.methodology.principles)}
            </div>
            <div class="panel">
              <div class="eyebrow">Threats to validity</div>
              <h3>What this benchmark does not hide</h3>
              ${panelList(benchmark.methodology.limits)}
            </div>
          </div>
          <div class="section-follow twocol">
            <div class="panel">
              <div class="eyebrow">Task suite</div>
              <h3>DAEB-1 canonical tasks</h3>
              <div class="table-wrap inset-table"><table><thead><tr><th>ID</th><th>Task</th><th>Level</th><th>Skill</th></tr></thead><tbody>${taskRows}</tbody></table></div>
            </div>
            <div class="panel">
              <div class="eyebrow">Scoring posture</div>
              <h3>Completed work over transcript fluency</h3>
              <p>The benchmark should award a cell when the intended product state exists and can be read back. Transcript quality can explain failure, but it should not stand in for verification.</p>
              <p>When a task does not map fairly to a vendor, AXArena should disclose that explicitly rather than silently treating it as a hidden failure or hidden omission.</p>
            </div>
          </div>
        `,
      )}

      ${section(
        "reproduce",
        "Reproduce",
        "From benchmark source to publication bundle",
        `
          <div class="twocol">
            <div>
              <pre>npm run ax-eval -- publication-bundle \\
  --suite targets/suites/daeb-1.yaml \\
  --vendors supabase,neon,planetscale,mongodb-atlas,turso,convex,insforge,cockroachdb \\
  --run-dir results/runs/daeb-1 \\
  --out results/publications/daeb-1</pre>
            </div>
            <div class="panel">
              <h3>Manifest includes</h3>
              <p>Canonical suite, vendor cards, oracle extracts, compiled packs, approvals, snapshots, normalized records, and competitive report links.</p>
              <div class="artifact-list">
                <span class="pill">manifest.json</span>
                <span class="pill">suite</span>
                <span class="pill">oracle extracts</span>
                <span class="pill">compiled packs</span>
                <span class="pill">snapshots</span>
                <span class="pill">normalized records</span>
              </div>
            </div>
          </div>
          <div class="section-follow twocol">
            <div class="panel">
              <div class="eyebrow">Prerequisites</div>
              <h3>What a clean rerun needs</h3>
              ${panelList(benchmark.reproduce.prerequisites)}
            </div>
            <div class="panel">
              <div class="eyebrow">Reproduction model</div>
              <h3>Three stages</h3>
              ${benchmark.reproduce.stages.map((stage) => `<p><strong>${esc(stage.title)}:</strong> ${esc(stage.body)}</p>`).join("")}
            </div>
          </div>
          <div class="section-follow">
            <pre>npm run ax-eval -- render-generated \\
  --snapshot results/publications/daeb-1/vendors/supabase/generated-eval.snapshot.json \\
  --html /tmp/supabase.html

npm run ax-eval -- competitive \\
  --results results/publications/daeb-1/vendors/*/normalized/*.normalized.json \\
  --html /tmp/daeb-1.html</pre>
          </div>
        `,
      )}

      ${section(
        "independence",
        "Independence",
        "Why a benchmark needs public trust, not just code",
        `
          <div class="grid-3">
            <div class="panel"><h3>No vendor funding</h3><p>AXArena does not accept funding, sponsorship, or in-kind compensation from listed vendors.</p></div>
            <div class="panel"><h3>No purchasable rank</h3><p>No score, rank, framing, or correction is purchasable or modifiable by payment.</p></div>
            <div class="panel"><h3>No veto</h3><p>Vendors receive factual preview, not editorial control.</p></div>
          </div>
          <div class="section-follow twocol">
            ${benchmark.independence.commitments.map((item) => `<div class="panel"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div>`).join("")}
          </div>
          <div class="section-follow callout"><h3>Corrections are public.</h3><p>Every factual correction and score-changing rerun belongs in the changelog with links to affected artifacts.</p></div>
        `,
      )}

      ${section(
        "about",
        "About",
        "Operator, links, and publication posture",
        `
          <div class="twocol">
            <div class="panel">
              <h3>Named operator</h3>
              <p>${esc(benchmark.about.operator)}</p>
              <p><strong>X:</strong> ${externalLink(benchmark.links.xUrl, benchmark.links.xHandle)}</p>
            </div>
            <div class="panel">
              <h3>Public repos</h3>
              <p><strong>Engine repo:</strong> ${externalLink(benchmark.links.engineRepoUrl, benchmark.links.engineRepoLabel)}</p>
              <p><strong>Site repo:</strong> ${externalLink(benchmark.links.siteRepoUrl, benchmark.links.siteRepoLabel)}</p>
            </div>
          </div>
          <div class="section-follow twocol">
            <div class="panel">
              <h3>Disclosure</h3>
              <p>${esc(benchmark.about.disclosure)}</p>
            </div>
            <div class="panel">
              <h3>Project direction</h3>
              <p>${esc(benchmark.about.positioning)}</p>
            </div>
          </div>
        `,
      )}

      ${section(
        "changelog",
        "Changelog",
        "Public record of corrections and version changes",
        `
          <div class="panel">
            <p>This log should record every score-affecting rerun, factual correction, and methodology change that matters for public interpretation. The goal is not just transparency at launch, but a durable audit trail after launch.</p>
          </div>
          <div class="section-follow">
            ${benchmark.changelog.map((entry) => `
              <div class="panel changelog-item">
                <div class="eyebrow">${esc(entry.date)}</div>
                <h3>${esc(entry.title)}</h3>
                <p>${esc(entry.text)}</p>
              </div>
            `).join("")}
          </div>
        `,
      )}
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

function redirectLegacyPage() {
  const map = {
    methodology: "methodology",
    reproduce: "reproduce",
    independence: "independence",
    changelog: "changelog",
    about: "about",
  };
  const target = map[page];
  if (!target) return false;
  window.location.replace(anchorHref(target));
  app.innerHTML = shell(`
    <main class="page">
      <section class="section panel">
        <div class="eyebrow">Redirecting</div>
        <h2>Opening the report section</h2>
        <p>If the redirect does not happen automatically, continue to ${externalLink(anchorHref(target), `/${target}`)}.</p>
      </section>
    </main>
  `, target);
  return true;
}

if (page === "database-vendor") renderVendor();
else if (!redirectLegacyPage()) renderDatabase();
