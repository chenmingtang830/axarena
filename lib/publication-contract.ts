import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const Harness = z.enum(["codex", "claude-code", "pi", "opencode"]);
const Surface = z.enum(["api", "cli"]);
const Status = z.enum(["pass", "fail", "na", "structural_na", "missing", "blocked", "unclassified"]);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);

const LeaderboardRow = z.object({
  rank: z.number().int().positive(),
  vendor: z.string().min(1),
  mean_pass_at_1: z.number().min(0).max(1),
  pass_3_rate: z.number().min(0).max(1).nullable(),
  pass_3_count: z.number().int().nonnegative().nullable(),
  pass_3_total: z.number().int().positive().nullable(),
  surface_count: z.number().int().positive(),
  surfaces: z.record(z.string(), z.unknown()),
}).strict();

const View = z.object({ rows: z.array(LeaderboardRow).min(1) }).strict();
const Leaderboard = z.object({
  schema: z.literal("ax.axarena-leaderboard/v2"),
  benchmark: z.string(),
  display_name: z.string(),
  generated_at: z.string(),
  scoring_authority: z.string().optional(),
  agents: z.array(z.object({
    configuration_id: z.string().min(1),
    harness: Harness,
    label: z.string().optional(),
    model: z.string().nullable(),
    effort: z.string(),
    harness_version_semver: z.string().nullable(),
    views: z.object({ overall: View, api: View, cli: View }).strict(),
  }).strict()).min(2),
}).strict();

const JourneyStep = z.object({
  phase: z.enum(["discovery", "authentication", "execution", "verification"]),
  status: z.string(),
  step_count: z.number().optional(),
  check_count: z.number().optional(),
}).strict();

export const TrialResult = z.object({
  id: z.string().min(1),
  vendor: z.string().min(1),
  task_id: z.string().min(1),
  success: z.boolean().nullable(),
  status: Status,
  profile: z.string(),
  configuration_id: z.string().min(1),
  harness: Harness,
  surface: Surface,
  model: z.string(),
  effort: z.string(),
  trial: z.number().int().min(1).max(3),
  batch_id: z.string(),
  harness_version: z.string(),
  oracle_results: z.array(z.object({ type: z.string(), passed: z.boolean(), detail: z.string() }).strict()),
  error: z.string().nullable(),
  prompt: z.object({
    text: z.string(),
    sha256,
    redaction_status: z.enum(["public", "redacted"]),
  }).strict(),
  execution_log: z.array(z.object({
    sequence: z.number().int().nonnegative(),
    offset_ms: z.number().nonnegative(),
    kind: z.enum(["discovery", "tool_call", "tool_result", "assistant", "oracle"]),
    tool: z.string().nullable(),
    command: z.string().nullable(),
    summary: z.string(),
    status: z.enum(["started", "completed", "failed", "blocked"]),
  }).strict()),
  output: z.object({
    assistant_summary: z.string().nullable(),
    stdout_excerpt: z.string().nullable(),
    stderr_excerpt: z.string().nullable(),
  }).strict(),
  journey: z.array(JourneyStep).length(4),
  diagnostics: z.object({
    latency_ms: z.number().nullable(),
    total_duration_ms: z.number().nullable(),
    first_action_latency_ms: z.number().nullable(),
    tool_call_count: z.number().nullable(),
    token_usage: z.unknown().nullable(),
    cost_usd: z.number().nullable(),
  }).strict(),
  evidence_refs: z.array(z.string()).min(1),
  evidence: z.object({
    record: z.string(),
    results: z.array(z.string()),
    trace: z.array(z.string()),
    transcript: z.string().nullable(),
  }).strict(),
}).strict();

const Tasks = z.object({
  schema: z.literal("ax.axarena-tasks/v2"), benchmark: z.string(), display_name: z.string(), generated_at: z.string(),
  tasks: z.array(z.object({
    task_id: z.string(), title: z.string(), difficulty: z.string(), intent: z.string(),
    kind: z.enum(["core", "research"]), allowed_surfaces: z.array(Surface),
    applicability: z.array(z.object({ vendor: z.string(), surface: Surface, status: z.enum(["applicable", "structural_na", "missing"]) }).strict()),
  }).strict()).min(1),
}).strict();

const Trials = z.object({
  schema: z.literal("ax.axarena-trials/v2"), benchmark: z.string(), display_name: z.string(), generated_at: z.string(), task_results: z.array(TrialResult).min(1),
}).strict();

const Evidence = z.object({
  schema: z.literal("ax.axarena-evidence-index/v2"), benchmark: z.string(), display_name: z.string(), generated_at: z.string(),
  evidence: z.array(z.object({
    id: z.string().min(1), kind: z.string(), vendor: z.string().optional(), surface: Surface.optional(), harness: Harness.optional(), trial: z.number().optional(), sha256: sha256.nullable(), public_path: z.string().min(1), path: z.string().min(1),
  }).strict()).min(1),
}).strict();

const Publication = z.object({
  schema: z.literal("ax.axarena-publication/v2"), benchmark: z.literal("axarena-database"), display_name: z.string(), category: z.literal("database"), suite_version: z.number(), generated_at: z.string(), publication_readiness: z.string(), synthetic: z.boolean().optional(), warning: z.string().optional(),
  cohort: z.array(z.object({ slug: z.string(), expected_surfaces: z.array(Surface) }).strict()).min(1),
  scope: z.object({ task_count: z.number(), surfaces: z.array(Surface), harnesses: z.array(Harness), effort_profiles: z.array(z.string()), trial_count: z.literal(3), cohort_cells: z.number().optional(), expected_cells: z.number(), completed_cells: z.number() }).strict(),
  execution: z.object({ batch_id: z.string(), source_commit_sha: z.string(), configuration_hash: sha256, pins: z.array(z.object({ configuration_id: z.string().min(1), harness: Harness, model: z.string().nullable(), effort: z.string().nullable(), harness_version: z.string().nullable() }).strict()) }).strict(),
  quality_gates: z.array(z.object({ id: z.string(), label: z.string(), status: z.string(), detail: z.string() }).strict()),
  integrity: z.object({ schema: z.string(), batch_manifest_sha256: sha256, batch_completion_sha256: sha256, runtime_report_sha256: sha256, attestation: z.record(z.string(), z.unknown()) }).strict(),
  notes: z.array(z.string()),
}).strict();

const Editorial = z.object({
  schema: z.literal("ax.axarena-editorial/v1"),
  vendors: z.record(z.string(), z.object({ name: z.string(), url: z.url(), descriptor: z.string(), summary: z.string(), limitations: z.array(z.string()) }).strict()),
  findings: z.array(z.object({ id: z.string(), title: z.string(), body: z.string(), evidence_refs: z.array(z.string()) }).strict()),
  limitations: z.array(z.string()),
}).strict();

const LooseFiles = {
  "cells.json": z.object({ schema: z.literal("ax.axarena-cells/v1"), cells: z.array(z.unknown()) }).passthrough(),
  "failures.json": z.object({ schema: z.literal("ax.axarena-failures/v2"), failures: z.array(z.unknown()) }).passthrough(),
  "readiness.json": z.object({ schema: z.literal("ax.axarena-readiness/v1"), affects_usability_rank: z.literal(false), vendors: z.array(z.unknown()) }).passthrough(),
  "methodology-index.json": z.object({ schema: z.literal("ax.axarena-methodology-index/v1"), methodology: z.unknown() }).passthrough(),
  "economics.json": z.object({ schema: z.string().regex(/economics\/v1$/), affects_rank: z.literal(false), cells: z.array(z.unknown()) }).passthrough(),
};

const schemas = {
  "publication.json": Publication,
  "leaderboard.json": Leaderboard,
  "tasks.json": Tasks,
  "trials.json": Trials,
  "evidence-index.json": Evidence,
  "editorial.json": Editorial,
  ...LooseFiles,
};

export type PublicationData = {
  publication: z.infer<typeof Publication>;
  leaderboard: z.infer<typeof Leaderboard>;
  tasks: z.infer<typeof Tasks>;
  trials: z.infer<typeof Trials>;
  evidence: z.infer<typeof Evidence>;
  editorial: z.infer<typeof Editorial>;
};

export function validatePublication(directory: string): PublicationData {
  const parsed: Record<string, unknown> = {};
  for (const [file, schema] of Object.entries(schemas)) {
    const path = resolve(directory, file);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      throw new Error(`Publication contract is missing or invalid at ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
    parsed[file] = schema.parse(raw);
  }

  const publication = parsed["publication.json"] as z.infer<typeof Publication>;
  const leaderboard = parsed["leaderboard.json"] as z.infer<typeof Leaderboard>;
  const tasks = parsed["tasks.json"] as z.infer<typeof Tasks>;
  const trials = parsed["trials.json"] as z.infer<typeof Trials>;
  const evidence = parsed["evidence-index.json"] as z.infer<typeof Evidence>;
  const editorial = parsed["editorial.json"] as z.infer<typeof Editorial>;
  const cohort = new Set(publication.cohort.map(({ slug }) => slug));
  const evidenceIds = new Set<string>();
  for (const item of evidence.evidence) {
    if (evidenceIds.has(item.id)) throw new Error(`Duplicate evidence id: ${item.id}`);
    evidenceIds.add(item.id);
  }
  for (const agent of leaderboard.agents) {
    for (const [viewName, view] of Object.entries(agent.views)) {
      view.rows.forEach((row, index) => {
        if (row.rank !== index + 1) throw new Error(`Rank parity failed for ${agent.harness}/${viewName}/${row.vendor}`);
        if (!cohort.has(row.vendor)) throw new Error(`Leaderboard vendor is outside the publication cohort: ${row.vendor}`);
        if (index && view.rows[index - 1]!.mean_pass_at_1 < row.mean_pass_at_1) throw new Error(`Stored rank order conflicts with score order in ${agent.harness}/${viewName}`);
      });
    }
  }
  const configurationIds = new Set(leaderboard.agents.map(({ configuration_id }) => configuration_id));
  if (configurationIds.size !== leaderboard.agents.length) throw new Error("Leaderboard configuration ids are not unique");
  const trialIds = new Set(trials.task_results.map(({ id }) => id));
  if (trialIds.size !== trials.task_results.length) throw new Error("Trial ids are not unique");
  for (const result of trials.task_results) {
    if (!cohort.has(result.vendor)) throw new Error(`Trial vendor is outside the publication cohort: ${result.vendor}`);
    if (!configurationIds.has(result.configuration_id)) throw new Error(`Trial references an unknown configuration: ${result.configuration_id}`);
    for (const ref of result.evidence_refs) if (!evidenceIds.has(ref)) throw new Error(`Unresolved evidence ref ${ref} on ${result.id}`);
  }
  for (const finding of editorial.findings) {
    for (const ref of finding.evidence_refs) if (!evidenceIds.has(ref)) throw new Error(`Editorial finding references unknown evidence: ${ref}`);
  }
  const serialized = JSON.stringify(parsed);
  if (/(?:Bearer\s+[A-Za-z0-9._~+/=-]{20,}|\b(?:api[_-]?key|access[_-]?token|password)\b\s*[":=]+\s*[^,}\s]{8,})/i.test(serialized)) {
    throw new Error("Publication data failed the redaction scan");
  }
  return { publication, leaderboard, tasks, trials, evidence, editorial };
}

let cache: PublicationData | undefined;
export function loadSyntheticPublication(): PublicationData {
  cache ??= validatePublication(resolve(process.cwd(), "public/data/axarena-database-v1-synthetic"));
  return cache;
}
