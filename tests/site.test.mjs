import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateDataset, validateReleaseDataset } from "../site-data.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dataRoot = resolve(root, "data/axarena-database-prepublication-fixture");
const releaseRoot = resolve(root, "data/axarena-database-1.0.0");

async function json(name) {
  return JSON.parse(await readFile(resolve(dataRoot, `${name}.json`), "utf8"));
}

async function release(name) {
  return JSON.parse(await readFile(resolve(releaseRoot, `${name}.json`), "utf8"));
}

test("public 1.0.0 is vendor-primary, complete, and checksum-bound", async () => {
  const data = {
    publication: await release("publication"),
    vendor_summary: await release("vendor-summary"),
    model_slices: await release("model-slices"),
    tasks: await release("tasks"),
    evidence_index: await release("evidence-index"),
    archive_manifest: await release("archive-manifest"),
    exclusions: await release("exclusions"),
    methodology: await release("methodology"),
    checksums: await release("checksums"),
  };
  assert.deepEqual(validateReleaseDataset(data), { errors: [], ready: true });
  assert.equal(data.publication.release, "1.0.0");
  assert.deepEqual(data.publication.protocol, { name: "DAEB", version: "2.4" });
  assert.deepEqual(data.vendor_summary.rows.map((row) => row.vendor), ["cockroachdb", "insforge", "neon", "nile", "supabase"]);
  assert.ok(data.vendor_summary.rows.every((row) => row.outcome_metrics.j01.planned === 14));
  assert.equal(data.model_slices.role, "supplementary");
  assert.equal(data.evidence_index.archives.length, 28);
  assert.equal(data.archive_manifest.public_evidence.archive_count, 28);
  assert.equal(data.archive_manifest.external_archive_required, false);
});

async function dataset() {
  return {
    publication: await json("publication"),
    leaderboard: await json("leaderboard"),
    cells: await json("cells"),
    tasks: await json("tasks"),
    evidence: await json("evidence-index"),
    editorial: await json("editorial"),
  };
}

test("draft export schemas, ranks, cells, and evidence references validate", async () => {
  const data = await dataset();
  const validation = validateDataset(data);
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.ready, false);
  assert.equal(data.publication.cohort.length, 6);
  assert.equal(data.publication.benchmark, "axarena-database");
  assert.equal(data.publication.display_name, "AXArena Database");
  assert.equal(data.editorial.question, "Can AI agents actually use your product?");
  assert.match(data.editorial.lede, /neutral, open-source agent usability benchmark/);
  assert.match(data.editorial.lede, /do not judge whether a product is good or bad/);
  assert.equal(data.tasks.tasks.filter((task) => task.kind === "core").length, 7);
  assert.equal(data.tasks.tasks.filter((task) => task.kind === "research").length, 3);
  assert.equal(data.cells.cells.length, 24);
  assert.deepEqual(data.leaderboard.rows.map((row) => row.rank), [1, 2, 3, 4, 5, 6]);
  assert.equal(data.leaderboard.ranking_method.discovery_affects_rank, false);
});

test("publication-ready mode rejects draft language or failing gates", async () => {
  const data = await dataset();
  data.publication.publication_readiness = "publication_ready";
  const validation = validateDataset(data);
  assert.equal(validation.ready, false);
  assert.ok(validation.errors.some((error) => error.includes("draft language")));
  assert.ok(validation.errors.some((error) => error.includes("failing gate")));
});

test("database, methodology, and blog pages expose the product, scores, pipeline, and open-source engine", async () => {
  const [html, methodologyHtml, blogHtml, app, css] = await Promise.all([
    readFile(resolve(root, "database/index.html"), "utf8"),
    readFile(resolve(root, "methodology/index.html"), "utf8"),
    readFile(resolve(root, "blog/introducing-axarena/index.html"), "utf8"),
    readFile(resolve(root, "app.js"), "utf8"),
    readFile(resolve(root, "styles.css"), "utf8"),
  ]);
  assert.match(html, /id="app"/);
  assert.match(methodologyHtml, /data-page="methodology"/);
  assert.match(blogHtml, /data-page="blog"/);
  assert.match(blogHtml, /Introducing AXArena Database 1\.0\.0/);
  for (const id of ["results", "task-matrix", "findings", "methodology-preview", "about", "evidence", "reproduce", "independence", "changelog"]) {
    assert.ok(app.includes(`"${id}"`), `missing ${id} section`);
  }
  for (const id of ["question", "contract", "execution", "verification", "aggregation", "validity", "publication", "open-source"]) {
    assert.ok(app.includes(`id="${id}"`), `missing methodology ${id} section`);
  }
  assert.match(app, /<svg class="bar-chart"/);
  assert.match(app, /class="github-mark"/);
  assert.match(app, /function arenaMark/);
  assert.match(app, /class="methodology-diagram"/);
  assert.match(app, /<svg viewBox="0 0 1200 500"/);
  assert.match(app, /function renderBlog/);
  assert.match(app, /Agents are becoming users of software/);
  assert.match(app, /Public release · 8 min read/);
  assert.match(app, /It generates no composite AX Score and no official rank/);
  assert.match(app, /href="\/blog\/introducing-axarena\/"/);
  assert.match(app, /aria-label="\$\{esc\(label\)\}"/);
  assert.match(app, /AX Score/);
  assert.match(app, /function renderDatabaseRelease/);
  assert.match(app, /J01 success/);
  assert.match(app, /No composite AX Score or rank/);
  assert.match(app, /function renderMethodologyRelease/);
  assert.match(app, /Fixed harness, multi-model samples, vendor-first results/);
  assert.match(app, /Draft — not for citation/);
  assert.match(css, /@media print/);
  assert.match(css, /--paper: #fff;/);
  assert.match(css, /--accent: #3157d5/);
  assert.match(css, /--accent-blue: #3157d5/);
  assert.match(css, /--accent-blue-light: #7892ef/);
  assert.match(css, /#aebcff 0, #e8ebff 34%/);
  assert.match(css, /span:nth-child\(9\).*background: var\(--accent-blue\)/s);
  assert.doesNotMatch(`${html}\n${methodologyHtml}\n${blogHtml}\n${app}\n${css}`, /https:\/\/(cdn|unpkg|fonts\.)/);
  assert.doesNotMatch(`${html}\n${methodologyHtml}\n${blogHtml}\n${app}`, /DAEB-1/);
});

test("legacy routes redirect into the single report", async () => {
  const app = await readFile(resolve(root, "app.js"), "utf8");
  assert.match(app, /location\.replace\(`\/database\/#vendor-/);
  assert.match(app, /location\.replace\(`\/database\/#\$\{section\}`/);
  assert.match(app, /document\.body\.dataset\.page === "methodology"/);
});
