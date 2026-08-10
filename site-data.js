export const DATA_ROOT = "/data/axarena-database-v1";
export const LOCAL_CALIBRATION_ROOT = "/data/axarena-local-calibration";
export const LOCAL_DATABASE_CALIBRATION_ROOT = "/data/axarena-local-calibration/database-v1";

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

export async function loadLocalCalibration(fetchImpl = fetch) {
  const response = await fetchImpl(`${LOCAL_CALIBRATION_ROOT}/calibration.json`);
  if (!response.ok) throw new Error(`Could not load local calibration (${response.status})`);
  return response.json();
}

export function validateLocalCalibration(data) {
  const errors = [];
  if (data?.schema !== "ax.axarena-local-calibration/v1") errors.push("unexpected local calibration schema");
  if (data?.trust_level !== "local") errors.push("local calibration must declare local trust");
  if (data?.publication_eligible !== false) errors.push("local calibration must be non-publishable");
  if (!Array.isArray(data?.models) || data.models.length !== 2) errors.push("local calibration must contain two exact model routes");
  if (!Array.isArray(data?.cells) || !data.cells.length) errors.push("local calibration has no completed cell evidence");
  if (!String(data?.warning ?? "").includes("NOT FOR PUBLICATION")) errors.push("local calibration warning is missing");
  return { errors, ready: errors.length === 0 };
}

export async function loadLocalDatabaseCalibration(fetchImpl = fetch) {
  const response = await fetchImpl(`${LOCAL_DATABASE_CALIBRATION_ROOT}/database-v1.json`);
  if (!response.ok) throw new Error(`Could not load local database calibration (${response.status})`);
  return response.json();
}

export function validateLocalDatabaseCalibration(data) {
  const errors = [];
  if (data?.schema !== "ax.axarena-local-calibration/v2") errors.push("unexpected local database calibration schema");
  if (data?.trust_level !== "local") errors.push("local database calibration must declare local trust");
  if (data?.publication_eligible !== false) errors.push("local database calibration must be non-publishable");
  if (data?.trial_count !== 1) errors.push("local database calibration must be single-trial");
  if (data?.profile !== "medium") errors.push("local database calibration must declare medium profile");
  if (!String(data?.warning ?? "").includes("NOT FOR PUBLICATION")) errors.push("local database warning is missing");
  if (!Array.isArray(data?.cells) || data.cells.length !== 24) errors.push("local database calibration must contain 24 display cells");
  const structural = (data?.cells ?? []).filter((cell) => cell.status === "structural_na");
  if (structural.length !== 2) errors.push("local database calibration must contain two structural N/A cells");
  for (const cell of data?.cells ?? []) {
    if (!cell.key || !cell.vendor || !cell.surface || !cell.harness || !cell.model) errors.push("local database cell identity is incomplete");
    if (cell.status === "completed" && cell.cleanup_status !== "confirmed") errors.push(`${cell.key} completed without confirmed cleanup`);
    if (cell.status === "structural_na" && !cell.reason) errors.push(`${cell.key} structural N/A has no reason`);
  }
  return { errors, ready: errors.length === 0 };
}
