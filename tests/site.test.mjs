import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateDataset } from "../site-data.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dataRoot = resolve(root, "data/axarena-database-v1");

async function json(name) {
  return JSON.parse(await readFile(resolve(dataRoot, `${name}.json`), "utf8"));
}

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
  assert.match(blogHtml, /Introducing AXArena: Benchmarking Agent Experience/);
  for (const id of ["results", "task-matrix", "findings", "methodology-preview", "about", "evidence", "reproduce", "independence", "changelog"]) {
    assert.ok(app.includes(`"${id}"`), `missing ${id} section`);
  }
  for (const id of ["category", "canonical-tasks", "adapters", "execution", "verification", "scoring", "database-v1", "open-source"]) {
    assert.ok(app.includes(`id="${id}"`), `missing methodology ${id} section`);
  }
  assert.match(app, /<svg class="bar-chart"/);
  assert.match(app, /class="github-mark"/);
  assert.match(app, /function arenaMark/);
  assert.match(app, /class="methodology-diagram"/);
  assert.match(app, /<svg viewBox="0 0 1200 500"/);
  assert.match(app, /function renderBlog/);
  assert.match(app, /Agents are becoming users of software/);
  assert.match(app, /href="\/blog\/introducing-axarena\/"/);
  assert.match(app, /aria-label="\$\{esc\(label\)\}"/);
  assert.match(app, /AX Score/);
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
