export const DATA_ROOT = "/data/axarena-database-v1";
export const V24_DATA_ROOT = "/data/axarena-database-v2.4";

const FILES = ["publication", "leaderboard", "cells", "tasks", "evidence-index", "editorial"];
const SCHEMAS = {
  publication: "ax.axarena-publication/v1",
  leaderboard: "ax.axarena-leaderboard/v2",
  cells: "ax.axarena-cells/v2",
  tasks: "ax.axarena-tasks/v2",
  evidence: "ax.axarena-evidence-index/v1",
  editorial: "ax.axarena-editorial/v1",
};

export async function loadDataset(fetchImpl = fetch) {
  const values = await Promise.all(FILES.map(async (name) => {
    const response = await fetchImpl(`${DATA_ROOT}/${name}.json`);
    if (!response.ok) throw new Error(`Could not load ${name}.json (${response.status})`);
    return response.json();
  }));
  return {
    publication: values[0],
    leaderboard: values[1],
    cells: values[2],
    tasks: values[3],
    evidence: values[4],
    editorial: values[5],
  };
}

const V24_FILES = ["publication", "vendor-summary", "model-slices", "tasks", "evidence-index", "exclusions", "methodology", "checksums"];

export async function loadV24Dataset(fetchImpl = fetch) {
  const values = await Promise.all(V24_FILES.map(async (name) => {
    const response = await fetchImpl(`${V24_DATA_ROOT}/${name}.json`);
    if (!response.ok) throw new Error(`Could not load ${name}.json (${response.status})`);
    return response.json();
  }));
  return Object.fromEntries(V24_FILES.map((name, index) => [name.replaceAll("-", "_"), values[index]]));
}

export function validateV24Dataset(data) {
  const errors = [];
  const publication = data.publication;
  const vendors = data.vendor_summary;
  const models = data.model_slices;
  if (publication?.schema !== "ax.daeb-v2-4-publication/v1") errors.push("invalid V2.4 publication schema");
  if (publication?.formal !== false || publication?.primary_unit !== "vendor") errors.push("V2.4 must be diagnostic and vendor-primary");
  if (publication?.sample?.atomic_cells !== 420 || publication?.sample?.j01_sessions !== 70) errors.push("unexpected V2.4 denominator");
  if (vendors?.schema !== "ax.daeb-v2-4-vendor-summary/v1" || vendors?.rows?.length !== 5) errors.push("V2.4 requires five vendor rows");
  if (models?.schema !== "ax.daeb-v2-4-model-slices/v1" || models?.role !== "supplementary" || models?.rows?.length !== 7) errors.push("V2.4 requires seven supplementary model slices");
  for (const row of vendors?.rows ?? []) if (row.outcome_metrics?.j01?.planned !== 14) errors.push(`${row.vendor} must have 14 J01 observations`);
  for (const family of ["atomic_status_counts", "j01_status_counts"]) {
    for (const status of ["invalid-infra", "invalid-route", "invalid-evidence"]) {
      if ((publication?.sample?.[family]?.[status] ?? 0) !== 0) errors.push(`${family} admits ${status}`);
    }
  }
  if (data.evidence_index?.archives?.length !== 28) errors.push("V2.4 requires 28 final-audit archives");
  if (!data.checksums?.tree_sha256 || data.checksums?.files?.length < 100) errors.push("V2.4 checksum inventory is incomplete");
  return { errors, ready: errors.length === 0 };
}

export function validateDataset(data) {
  const errors = [];
  for (const [key, schema] of Object.entries(SCHEMAS)) {
    if (data[key]?.schema !== schema) errors.push(`${key} must use ${schema}`);
  }
  const benchmark = data.publication?.benchmark;
  if (benchmark !== "axarena-database") errors.push("publication benchmark must be axarena-database");
  if (data.publication?.display_name !== "AXArena Database") errors.push("publication display name must be AXArena Database");
  for (const key of ["leaderboard", "cells", "tasks", "editorial"]) {
    if (benchmark && data[key]?.benchmark !== benchmark) errors.push(`${key} benchmark does not match ${benchmark}`);
  }

  const rows = data.leaderboard?.rows ?? [];
  const ranked = rows.filter((row) => row.status === "ranked");
  for (let index = 1; index < ranked.length; index++) {
    const previous = ranked[index - 1];
    const current = ranked[index];
    const ordered = previous.intersection_score > current.intersection_score ||
      (previous.intersection_score === current.intersection_score &&
        previous.intersection_consistency_at_3 >= current.intersection_consistency_at_3);
    if (!ordered) errors.push("leaderboard rows are not sorted by score and reliability");
  }
  if (data.leaderboard?.ranking_method?.discovery_affects_rank !== false) {
    errors.push("Agent Discovery Score must not affect rank");
  }

  const cohort = new Set(data.publication?.cohort ?? []);
  const rowVendors = new Set(rows.map((row) => row.vendor));
  for (const vendor of cohort) if (!rowVendors.has(vendor)) errors.push(`missing leaderboard row for ${vendor}`);
  const cellIds = new Set((data.cells?.cells ?? []).map((cell) => cell.id));
  for (const row of rows) {
    for (const cell of row.cells ?? []) if (!cellIds.has(cell)) errors.push(`missing cell ${cell}`);
  }

  const evidenceIds = new Set((data.evidence?.evidence ?? []).map((item) => item.id));
  for (const finding of data.editorial?.findings ?? []) {
    if (!finding.evidence_refs?.length) errors.push(`finding "${finding.title}" has no evidence reference`);
    for (const ref of finding.evidence_refs ?? []) if (!evidenceIds.has(ref)) errors.push(`unknown evidence reference ${ref}`);
  }

  const readiness = data.publication?.publication_readiness;
  const gatesPass = (data.publication?.quality_gates ?? []).every((gate) => gate.status !== "fail");
  const ranksComplete = rows.length > 0 && rows.every((row) => row.status === "ranked" && row.rank !== null);
  if (readiness === "publication_ready") {
    const copy = JSON.stringify(data.editorial).toLowerCase();
    if (/placeholder|illustrative|draft fixture/.test(copy)) errors.push("publication-ready editorial contains draft language");
    if (!gatesPass) errors.push("publication-ready data contains a failing gate");
    if (!ranksComplete) errors.push("publication-ready data contains incomplete ranks");
  }

  return {
    errors,
    ready: readiness === "publication_ready" && gatesPass && ranksComplete && errors.length === 0,
  };
}
