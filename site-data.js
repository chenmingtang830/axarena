export const DATA_ROOT = "/data/axarena-database-v1";

const FILES = ["publication", "benchmark", "cells", "tasks", "evidence-index", "editorial"];
const SCHEMAS = {
  publication: "ax.axarena-publication/v1",
  benchmark: "ax.axarena-benchmark/v2",
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
    benchmark: values[1],
    cells: values[2],
    tasks: values[3],
    evidence: values[4],
    editorial: values[5],
  };
}

export function validateDataset(data) {
  const errors = [];
  for (const [key, schema] of Object.entries(SCHEMAS)) {
    if (data[key]?.schema !== schema) errors.push(`${key} must use ${schema}`);
  }
  const benchmark = data.publication?.benchmark;
  if (benchmark !== "axarena-database") errors.push("publication benchmark must be axarena-database");
  if (data.publication?.display_name !== "AXArena Database") errors.push("publication display name must be AXArena Database");
  for (const key of ["benchmark", "cells", "tasks", "editorial"]) {
    if (benchmark && data[key]?.benchmark !== benchmark) errors.push(`${key} benchmark does not match ${benchmark}`);
  }

  const rows = data.benchmark?.rows ?? [];
  const ranked = rows.filter((row) => row.status === "ranked");
  for (let index = 1; index < ranked.length; index++) {
    const previous = ranked[index - 1];
    const current = ranked[index];
    const ordered = previous.intersection_score > current.intersection_score ||
      (previous.intersection_score === current.intersection_score &&
        previous.intersection_consistency_at_3 >= current.intersection_consistency_at_3);
    if (!ordered) errors.push("benchmark rows are not sorted by score and reliability");
  }
  if (data.benchmark?.ranking_method?.discovery_affects_rank !== false) {
    errors.push("Agent Discovery Score must not affect rank");
  }

  const cohort = new Set(data.publication?.cohort ?? []);
  const rowVendors = new Set(rows.map((row) => row.vendor));
  for (const vendor of cohort) if (!rowVendors.has(vendor)) errors.push(`missing benchmark row for ${vendor}`);
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
