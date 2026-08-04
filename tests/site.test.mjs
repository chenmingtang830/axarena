import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fixtureRoot = resolve(root, "public/data/axarena-database-v1-synthetic");
const source = (path) => readFile(resolve(root, path), "utf8");
const json = async (name) => JSON.parse(await readFile(resolve(fixtureRoot, name), "utf8"));

test("synthetic presentation contract keeps harnesses, rank, evidence, and diagnostics separate", async () => {
  const [publication, leaderboard, tasks, trials, evidence, readiness, economics] = await Promise.all([
    json("publication.json"), json("leaderboard.json"), json("tasks.json"), json("trials.json"), json("evidence-index.json"), json("readiness.json"), json("economics.json"),
  ]);
  assert.equal(publication.synthetic, true);
  assert.match(publication.warning, /DO NOT CITE/);
  assert.deepEqual([...new Set(leaderboard.agents.map(({ harness }) => harness))].sort(), ["claude-code", "codex", "opencode", "pi"]);
  assert.equal(new Set(leaderboard.agents.map(({ configuration_id }) => configuration_id)).size, leaderboard.agents.length);
  assert.ok(leaderboard.agents.filter(({ harness }) => harness === "pi").length >= 2);
  assert.equal(leaderboard.agents.some(({ harness }) => /combined|overall-agent/i.test(harness)), false);
  for (const agent of leaderboard.agents) for (const view of Object.values(agent.views)) assert.deepEqual(view.rows.map(({ rank }) => rank), [1, 2, 3, 4, 5, 6]);
  assert.equal(tasks.tasks.length, 7);
  assert.equal(trials.task_results.length, 1260);
  assert.equal(new Set(trials.task_results.map(({ id }) => id)).size, trials.task_results.length);
  assert.equal(new Set(evidence.evidence.map(({ id }) => id)).size, evidence.evidence.length);
  assert.ok(trials.task_results.every((trial) => trial.evidence_refs.every((id) => evidence.evidence.some((item) => item.id === id))));
  assert.equal(readiness.affects_usability_rank, false);
  assert.equal(economics.affects_rank, false);
  assert.ok(trials.task_results.every((trial) => trial.journey.length === 4));
  assert.ok(trials.task_results.every((trial) => trial.prompt?.sha256 && trial.execution_log?.length && trial.output));
});

test("three prototypes share interactions while preserving distinct visual themes", async () => {
  const [explorer, vendor, css] = await Promise.all([source("components/benchmark-explorer.tsx"), source("components/vendor-explorer.tsx"), source("app/globals.css")]);
  for (const mode of ["verdict", "ledger", "journey"]) {
    assert.match(explorer, new RegExp(`${mode}:`));
    assert.match(css, new RegExp(`\\.theme-${mode}`));
  }
  for (const label of ["Codex", "Claude Code", "Overall", "API", "CLI"]) assert.ok(`${explorer}${vendor}`.includes(label));
  assert.match(explorer, /trial-glyph/);
  assert.match(explorer, /live-state oracle/i);
  assert.match(vendor, /Representative agent journey/);
});

test("ledger progressively discloses evidence without route navigation", async () => {
  const [ledger, contract, css] = await Promise.all([
    source("components/ledger-explorer.tsx"),
    source("lib/publication-contract.ts"),
    source("app/globals.css"),
  ]);
  assert.match(ledger, /The cross-configuration verdict/);
  assert.match(ledger, /crossHarnessRows/);
  assert.match(ledger, /minimum: Math\.min/);
  assert.match(ledger, /maximum: Math\.max/);
  assert.match(ledger, /Bar = configuration average/);
  assert.match(ledger, /role="dialog"/);
  assert.match(ledger, /aria-modal="true"/);
  assert.match(ledger, /panel: "vendor"/);
  assert.match(ledger, /AXArena-Database/);
  assert.match(ledger, /The first agent experience benchmark for database products/);
  assert.match(ledger, /Database agent experience, at a glance/);
  assert.match(ledger, /Every run and all three trials/);
  assert.match(ledger, /Sanitized execution log/);
  assert.match(ledger, /trial\.prompt\.text/);
  assert.match(ledger, /scrollIntoView/);
  assert.match(ledger, /run-entry.*evidence-open/);
  assert.match(ledger, /value >= \.8/);
  assert.match(ledger, /value >= \.6/);
  assert.match(ledger, /Performance bands/);
  for (const tier of ["strong", "mixed", "limited", "unavailable"]) assert.ok(`${ledger}${css}`.includes(`tier-${tier}`));
  assert.doesNotMatch(ledger, /setMatrixOpen/);
  assert.doesNotMatch(ledger, /aria-label="Agent harness"/);
  assert.doesNotMatch(ledger, /aria-label="Product surface"/);
  assert.match(ledger, /navigator\.clipboard/);
  assert.match(ledger, /DenseLeaderboard/);
  assert.match(ledger, /Cross-configuration context/);
  assert.match(ledger, /Diagnostics/);
  assert.match(css, /\.analysis-table/);
  assert.match(css, /\.analysis-metric/);
  assert.match(contract, /"pi"/);
  assert.match(contract, /"opencode"/);
  assert.match(contract, /\.min\(2\)/);
  assert.doesNotMatch(ledger, /\/vendors\/\$\{/);
  assert.doesNotMatch(ledger, /\/trials\/\$\{/);
});

test("formal IA, static export, noindex, and markdown siblings are present", async () => {
  const [config, layout, robots] = await Promise.all([source("next.config.ts"), source("app/layout.tsx"), source("app/robots.ts")]);
  assert.match(config, /output: "export"/);
  assert.match(layout, /index: false/);
  assert.match(robots, /disallow: "\/"/);
  for (const route of ["app/database/page.tsx", "app/database/compare/page.tsx", "app/methodology/page.tsx", "app/reproduce/page.tsx", "app/independence/page.tsx", "app/changelog/page.tsx", "app/data/page.tsx"]) await assert.doesNotReject(() => source(route));
  for (const file of ["methodology.md", "reproduce.md", "independence.md", "changelog.md"]) await assert.doesNotReject(() => source(`public/${file}`));
});

test("all six result states have text-bearing presentation semantics", async () => {
  const [css, explorer, receipt] = await Promise.all([source("app/globals.css"), source("components/benchmark-explorer.tsx"), source("components/detail-pages.tsx")]);
  for (const state of ["pass", "fail", "structural_na", "missing", "blocked", "unclassified"]) assert.ok(`${css}${explorer}${receipt}`.includes(state), `missing state ${state}`);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /@media print/);
});

test("the generated fixture exposes the ten formal indexes plus editorial catalog", async () => {
  const files = await readdir(fixtureRoot);
  for (const expected of ["publication.json", "leaderboard.json", "cells.json", "tasks.json", "trials.json", "failures.json", "evidence-index.json", "readiness.json", "methodology-index.json", "economics.json", "editorial.json"]) assert.ok(files.includes(expected));
});
