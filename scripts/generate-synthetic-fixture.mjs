import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "public/data/axarena-database-v1-synthetic");
mkdirSync(root, { recursive: true });

const generatedAt = "2026-08-02T12:00:00.000Z";
const vendors = ["neon", "cockroachdb", "turso", "supabase", "insforge", "nile"];
const vendorMeta = {
  neon: { name: "Neon", url: "https://neon.com", descriptor: "Serverless Postgres" },
  cockroachdb: { name: "CockroachDB", url: "https://www.cockroachlabs.com", descriptor: "Distributed SQL" },
  turso: { name: "Turso", url: "https://turso.tech", descriptor: "Edge SQLite" },
  supabase: { name: "Supabase", url: "https://supabase.com", descriptor: "Postgres platform" },
  insforge: { name: "InsForge", url: "https://insforge.dev", descriptor: "Agent-native backend" },
  nile: { name: "Nile", url: "https://www.thenile.dev", descriptor: "Multi-tenant Postgres" },
};

const taskDefs = [
  ["db-T01-access-control", "Configure an idiomatic access-control mechanism", "L2", "Configure a documented access-control mechanism and leave it discoverable."],
  ["db-T02-evolve-schema", "Apply a schema evolution", "L3", "Add a status field without replacing the task-scoped container."],
  ["db-T03-inspect-schema", "Inspect container metadata", "L1", "Confirm name and status fields through the metadata surface."],
  ["db-T04-query-records", "Filter and read matching records", "L2", "Create three records and return only the two active matches."],
  ["db-T05-vector-search", "Create a vector-enabled dataset and query it", "L2", "Create a three-dimensional vector index and rank alpha first."],
  ["db-T06-write-records", "Create, update, and delete one record lifecycle", "L2", "Complete one verified CRUD lifecycle."],
  ["db-T07-full-text-search", "Create a searchable text dataset and query it", "L2", "Return orchard as the top full-text result."],
];

const scores = {
  codex: {
    overall: { neon: [.86, .79], turso: [.81, .72], supabase: [.76, .74], cockroachdb: [.71, .69], insforge: [.62, .55], nile: [.55, .48] },
    api: { neon: [.91, .86], supabase: [.84, .81], cockroachdb: [.78, .76], turso: [.72, .62], nile: [.61, .52], insforge: [.58, .48] },
    cli: { turso: [.90, .83], neon: [.81, .71], insforge: [.66, .61], supabase: [.68, .67], cockroachdb: [.64, .62], nile: [.49, .43] },
  },
  "claude-code": {
    overall: { cockroachdb: [.84, .81], supabase: [.80, .76], neon: [.74, .69], nile: [.67, .62], turso: [.64, .57], insforge: [.58, .50] },
    api: { supabase: [.88, .86], cockroachdb: [.86, .83], neon: [.78, .71], nile: [.73, .69], turso: [.60, .52], insforge: [.57, .48] },
    cli: { cockroachdb: [.82, .79], turso: [.68, .62], neon: [.70, .67], insforge: [.59, .52], supabase: [.72, .67], nile: [.61, .55] },
  },
};

const clamp = (value) => Math.max(.25, Math.min(.95, Number(value.toFixed(2))));
const shiftedScores = (source, shift, seed) => Object.fromEntries(Object.entries(source).map(([surface, rows]) => [surface, Object.fromEntries(Object.entries(rows).map(([vendor, [mean, consistency]]) => {
  const variance = (((vendors.indexOf(vendor) + seed) % 3) - 1) * .025;
  return [vendor, [clamp(mean + shift + variance), clamp(consistency + shift - .02 + variance)]];
}))]));
scores["opencode-open-a"] = shiftedScores(scores.codex, -.07, 1);
scores["pi-open-a"] = shiftedScores(scores["claude-code"], -.09, 2);
scores["pi-open-b"] = shiftedScores(scores.codex, -.12, 3);

const configurations = [
  { configuration_id: "codex-gpt", harness: "codex", label: "Codex", model: "gpt-5.6-terra", effort: "high", harness_version_semver: "1.2.3-synthetic", scoreKey: "codex" },
  { configuration_id: "claude-code-claude", harness: "claude-code", label: "Claude Code", model: "claude-sonnet-5", effort: "high", harness_version_semver: "2.3.4-synthetic", scoreKey: "claude-code" },
  { configuration_id: "opencode-open-a", harness: "opencode", label: "OpenCode", model: "open-model-a", effort: "high", harness_version_semver: "1.0.0-synthetic", scoreKey: "opencode-open-a" },
  { configuration_id: "pi-open-a", harness: "pi", label: "Pi", model: "open-model-a", effort: "high", harness_version_semver: "0.1.0-synthetic", scoreKey: "pi-open-a" },
  { configuration_id: "pi-open-b", harness: "pi", label: "Pi", model: "open-model-b", effort: "high", harness_version_semver: "0.1.0-synthetic", scoreKey: "pi-open-b" },
];

const rankView = (values) => ({
  rows: Object.entries(values).map(([vendor, [mean, consistency]]) => ({
    rank: 0,
    vendor,
    mean_pass_at_1: mean,
    pass_3_rate: consistency,
    pass_3_count: Math.round(consistency * 14),
    pass_3_total: 14,
    surface_count: 2,
    surfaces: {},
  })).sort((a, b) => b.mean_pass_at_1 - a.mean_pass_at_1).map((row, index) => ({ ...row, rank: index + 1 })),
});

const leaderboard = {
  schema: "ax.axarena-leaderboard/v2",
  benchmark: "axarena-database",
  display_name: "AXArena-Database",
  generated_at: generatedAt,
  scoring_authority: "verified live-state oracle outcomes only",
  agents: configurations.map(({ scoreKey, ...configuration }) => ({ ...configuration, views: Object.fromEntries(Object.entries(scores[scoreKey]).map(([key, value]) => [key, rankView(value)])) })),
};

const hash = (value) => createHash("sha256").update(value).digest("hex");
const taskResults = [];
const evidence = [];
const failures = [];
const statusFor = (vendor, taskIndex, configuration, surface, trial) => {
  const { harness, scoreKey } = configuration;
  if (vendor === "nile" && taskIndex === 4 && surface === "cli") return "structural_na";
  if (vendor === "insforge" && taskIndex === 6 && surface === "cli") return "structural_na";
  if (vendor === "insforge" && taskIndex === 1 && harness === "claude-code" && surface === "api") return "blocked";
  if (vendor === "nile" && taskIndex === 0 && harness === "codex" && surface === "cli" && trial === 3) return "missing";
  const base = scores[scoreKey][surface][vendor]?.[0] ?? .5;
  const signal = ((vendors.indexOf(vendor) * 5 + taskIndex * 3 + trial + configurations.indexOf(configuration) * 2 + (surface === "api" ? 2 : 0)) % 10) / 10;
  return signal < base ? "pass" : "fail";
};

for (const [taskIndex, [taskId]] of taskDefs.entries()) {
  for (const vendor of vendors) {
    for (const configuration of configurations) {
      const { configuration_id, harness, model, effort, harness_version_semver } = configuration;
      for (const surface of ["api", "cli"]) {
        for (const trial of [1, 2, 3]) {
          const status = statusFor(vendor, taskIndex, configuration, surface, trial);
          const trialId = `${vendor}-${surface}-${configuration_id}-${taskId}-trial-${trial}`;
          const evidenceId = `ev-${hash(trialId).slice(0, 16)}`;
          const passed = status === "pass";
          const result = {
            id: trialId,
            vendor,
            task_id: taskId,
            success: passed ? true : status === "fail" ? false : null,
            status: status === "structural_na" ? "na" : status,
            profile: "high",
            configuration_id,
            harness,
            surface,
            model,
            effort,
            trial,
            batch_id: "synthetic-batch-2026-08-02",
            harness_version: harness_version_semver,
            oracle_results: status === "missing" || status === "blocked" || status === "structural_na" ? [] : [{ type: "live_state_readback", passed, detail: passed ? "Expected state observed." : "Expected state was not observed." }],
            error: status === "fail" ? "Verification completed without the required live state." : status === "blocked" ? "Credential scope blocked execution." : null,
            prompt: {
              text: `Complete ${taskDefs[taskIndex][1].toLowerCase()} using the documented ${vendor} ${surface.toUpperCase()} surface. Work only inside namespace axarena-synthetic and leave the requested state for verification.`,
              sha256: hash(`${taskId}:${vendor}:${surface}:prompt`),
              redaction_status: "public",
            },
            execution_log: [
              { sequence: 1, offset_ms: 0, kind: "discovery", tool: "web_search", command: null, summary: `Located the official ${vendor} ${surface.toUpperCase()} documentation and authentication path.`, status: "completed" },
              { sequence: 2, offset_ms: 820, kind: "tool_call", tool: surface === "api" ? "http" : "shell", command: surface === "api" ? `POST /synthetic/${taskId}` : `${vendor} synthetic-run --task ${taskId}`, summary: "Issued the task-scoped write using redacted credentials.", status: status === "blocked" ? "blocked" : "completed" },
              { sequence: 3, offset_ms: 3100, kind: "tool_result", tool: surface === "api" ? "http" : "shell", command: null, summary: passed ? "The product returned a successful task-scoped result." : "Execution returned without establishing the full expected state.", status: status === "blocked" ? "blocked" : status === "fail" ? "failed" : "completed" },
              { sequence: 4, offset_ms: 7600, kind: "oracle", tool: "live_state_readback", command: `GET /synthetic/${taskId}`, summary: passed ? "Read-back observed the expected live state." : "Read-back did not observe the complete expected state.", status: passed ? "completed" : "failed" },
            ],
            output: {
              assistant_summary: passed ? "Completed the requested workflow and left the resource available for verification." : "Attempted the workflow; verification did not confirm the complete requested state.",
              stdout_excerpt: surface === "cli" ? (passed ? "synthetic operation completed\nresource retained for verification" : "synthetic operation incomplete") : null,
              stderr_excerpt: status === "blocked" ? "credential scope rejected the requested operation" : null,
            },
            journey: [
              { phase: "discovery", status: status === "missing" ? "not_observed" : "observed", step_count: status === "missing" ? 0 : 2 },
              { phase: "authentication", status: status === "blocked" ? "blocked" : status === "missing" ? "not_observed" : "observed", step_count: status === "blocked" ? 1 : status === "missing" ? 0 : 1 },
              { phase: "execution", status: ["blocked", "missing", "structural_na"].includes(status) ? "not_observed" : "observed", step_count: ["blocked", "missing", "structural_na"].includes(status) ? 0 : 4 },
              { phase: "verification", status: passed ? "passed" : status === "fail" ? "failed" : "not_observed", check_count: ["pass", "fail"].includes(status) ? 1 : 0 },
            ],
            diagnostics: { latency_ms: 900 + taskIndex * 130 + trial * 70, total_duration_ms: 9000 + taskIndex * 850, first_action_latency_ms: 620, tool_call_count: 5 + taskIndex, token_usage: null, cost_usd: null },
            evidence_refs: [evidenceId],
            evidence: { record: `records/${trialId}.json`, results: [`receipts/${trialId}.json`], trace: [`traces/${trialId}.json`], transcript: null },
          };
          taskResults.push(result);
          evidence.push({ id: evidenceId, kind: "oracle_receipt", vendor, surface, harness, trial, sha256: hash(JSON.stringify(result.oracle_results)), public_path: `/database/trials/${trialId}/`, path: `receipts/${trialId}.json` });
          if (status === "fail") failures.push({ trial_id: result.id, vendor, task_id: taskId, configuration_id, harness, model, surface, trial, failure_type: "unclassified", classification_status: "needs_review", evidence_refs: [evidenceId] });
        }
      }
    }
  }
}

const tasks = taskDefs.map(([task_id, title, difficulty, intent]) => ({
  task_id,
  title,
  difficulty,
  intent,
  kind: "core",
  allowed_surfaces: ["api", "cli"],
  applicability: vendors.flatMap((vendor) => ["api", "cli"].map((surface) => ({
    vendor,
    surface,
    status: (vendor === "nile" && task_id === "db-T05-vector-search" && surface === "cli") || (vendor === "insforge" && task_id === "db-T07-full-text-search" && surface === "cli") ? "structural_na" : "applicable",
  }))),
}));

const publication = {
  schema: "ax.axarena-publication/v2",
  benchmark: "axarena-database",
  display_name: "AXArena-Database",
  category: "database",
  suite_version: 1,
  generated_at: generatedAt,
  publication_readiness: "prototype_synthetic",
  synthetic: true,
  warning: "PROTOTYPE · SYNTHETIC VALUES · DO NOT CITE",
  cohort: vendors.map((slug) => ({ slug, expected_surfaces: ["api", "cli"] })),
  scope: { task_count: taskDefs.length, surfaces: ["api", "cli"], harnesses: [...new Set(configurations.map(({ harness }) => harness))], effort_profiles: ["high"], trial_count: 3, expected_cells: vendors.length * configurations.length * 2, completed_cells: vendors.length * configurations.length * 2 },
  execution: { batch_id: "synthetic-batch-2026-08-02", source_commit_sha: "synthetic", configuration_hash: hash("synthetic-configuration"), pins: leaderboard.agents.map(({ configuration_id, harness, model, effort, harness_version_semver }) => ({ configuration_id, harness, model, effort, harness_version: harness_version_semver })) },
  quality_gates: [
    { id: "synthetic-data", label: "Synthetic fixture only", status: "warn", detail: "Production rerun remains deferred." },
    { id: "rank-parity", label: "Stored leaderboard rank parity", status: "pass", detail: "Every view is ordered by its sealed rank field." },
    { id: "evidence-coverage", label: "Evidence references resolve", status: "pass", detail: "Every synthetic trial resolves to a receipt." },
  ],
  integrity: { schema: "ax.publication-integrity/v1", batch_manifest_sha256: hash("batch"), batch_completion_sha256: hash("completion"), runtime_report_sha256: hash("runtime"), attestation: { status: "synthetic" } },
  notes: ["Transcript, journey, tokens, cost, and timing are diagnostic only.", "Only live-state oracle outcomes are authoritative for success."]
};

const cells = leaderboard.agents.flatMap((agent) => ["api", "cli"].flatMap((surface) => agent.views[surface].rows.map((row) => ({
  id: `${row.vendor}/${surface}/${agent.configuration_id}/high`, configuration_id: agent.configuration_id, vendor: row.vendor, surface, harness: agent.harness, model: agent.model, effort: "high", profiles: ["high"], task_count: 7, tasks_passed: Math.round(row.mean_pass_at_1 * 7), mean_success_rate: row.mean_pass_at_1, pass_3_rate: row.pass_3_rate, trial_count: 3, latency_ms: 1220, total_duration_ms: 14400, tool_call_count: 8, token_usage: null, cost_usd: null, cost_status: "unavailable", estimated_cost_usd: null, validity_status: "synthetic", run_batch_id: publication.execution.batch_id,
}))));

const files = {
  "publication.json": publication,
  "leaderboard.json": leaderboard,
  "cells.json": { schema: "ax.axarena-cells/v1", benchmark: publication.benchmark, display_name: publication.display_name, generated_at: generatedAt, cells },
  "tasks.json": { schema: "ax.axarena-tasks/v2", benchmark: publication.benchmark, display_name: publication.display_name, generated_at: generatedAt, tasks },
  "trials.json": { schema: "ax.axarena-trials/v2", benchmark: publication.benchmark, display_name: publication.display_name, generated_at: generatedAt, task_results: taskResults },
  "failures.json": { schema: "ax.axarena-failures/v2", benchmark: publication.benchmark, display_name: publication.display_name, generated_at: generatedAt, failures },
  "evidence-index.json": { schema: "ax.axarena-evidence-index/v2", benchmark: publication.benchmark, display_name: publication.display_name, generated_at: generatedAt, evidence },
  "readiness.json": { schema: "ax.axarena-readiness/v1", benchmark: publication.benchmark, display_name: publication.display_name, generated_at: generatedAt, affects_usability_rank: false, vendors: vendors.map((vendor) => ({ vendor, agent_discovery: [...new Set(configurations.map(({ harness }) => harness))].map((harness) => ({ harness, status: "measured", score: Number((.55 + ((vendors.indexOf(vendor) * 7 + harness.length) % 35) / 100).toFixed(2)) })), static_readiness: { status: "methodology_only", score: null, methodology_artifacts: ["suite.methodology.yaml"] } })) },
  "methodology-index.json": { schema: "ax.axarena-methodology-index/v1", benchmark: publication.benchmark, display_name: publication.display_name, generated_at: generatedAt, methodology: { source_of_truth: "verified live-state read-back", behavioral: ["suite.yaml", "grader-ledger.yaml"], static_ax: ["suite.methodology.yaml"], trial_policy: "Three clean-environment trials per agent × vendor × surface × task." } },
  "economics.json": { schema: "ax.arena-economics/v1", generated_at: generatedAt, context_only: true, affects_rank: false, cells: cells.map(({ id, vendor, surface, harness }) => ({ id, product: vendor, surface, harness, status: "unavailable", estimated_cost_usd: null, cost_per_success_usd: null })) },
  "editorial.json": { schema: "ax.axarena-editorial/v1", vendors: Object.fromEntries(Object.entries(vendorMeta).map(([slug, meta]) => [slug, { ...meta, summary: `${meta.descriptor} evaluated on the same canonical Database v1 task intent.`, limitations: ["All values in this prototype are synthetic."] }])), findings: [
    { id: "finding-rank-reversal", title: "The agent changes the verdict", body: "Codex places Neon first; Claude Code places CockroachDB first in the synthetic fixture.", evidence_refs: [evidence[0].id] },
    { id: "finding-surface-divergence", title: "Surface quality is not interchangeable", body: "Turso’s synthetic CLI result materially exceeds its API result under Codex.", evidence_refs: [evidence.find((entry) => entry.vendor === "turso" && entry.surface === "cli").id] },
  ], limitations: ["Production execution is deferred.", "Vendor names are real; every result, receipt, duration, and score is synthetic.", "Cost and readiness never affect usability rank."] },
};

for (const [name, value] of Object.entries(files)) {
  writeFileSync(resolve(root, name), `${JSON.stringify(value, null, 2)}\n`);
}

console.log(`wrote ${Object.keys(files).length} synthetic publication files to ${root}`);
