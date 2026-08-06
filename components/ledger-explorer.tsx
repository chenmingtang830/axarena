"use client";

import { scaleLinear } from "d3-scale";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PublicationData } from "@/lib/publication-contract";

type Panel = "vendor";

const statusLabel: Record<string, string> = {
  pass: "Pass", fail: "Fail", na: "Structural N/A", structural_na: "Structural N/A",
  missing: "Missing", blocked: "Blocked", unclassified: "Unclassified",
};

function percent(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function scoreTier(value: number | null) {
  if (value === null) return "unavailable";
  if (value >= .8) return "strong";
  if (value >= .6) return "mixed";
  return "limited";
}

export function LedgerExplorer({ data }: { data: PublicationData }) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [shareState, setShareState] = useState("Copy link");
  const queryPanel = search.get("panel") === "vendor" ? "vendor" : null;
  const queryVendor = search.get("vendor");
  // Keep the interaction responsive even when the static-export router does not
  // immediately commit a search-param navigation. The URL remains the shareable
  // source of truth, while this local value provides the optimistic UI state.
  const [openVendorSlug, setOpenVendorSlug] = useState<string | null>(queryPanel ? queryVendor : null);
  const panel = (openVendorSlug ? "vendor" : null) as Panel | null;
  const vendor = openVendorSlug;
  const x = scaleLinear().domain([0, 1]).range([0, 100]);
  const crossHarnessRows = useMemo(() => data.publication.cohort.map(({ slug }) => {
    const values = data.leaderboard.agents.map((configuration) => configuration.views.overall.rows.find((row) => row.vendor === slug)?.mean_pass_at_1).filter((value): value is number => value !== undefined);
    return { vendor: slug, average: values.reduce((sum, value) => sum + value, 0) / values.length, minimum: Math.min(...values), maximum: Math.max(...values), values };
  }).sort((left, right) => right.average - left.average), [data.leaderboard.agents, data.publication.cohort]);
  const crossHarnessLeader = crossHarnessRows[0]!;

  const update = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(search.toString());
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  const openVendor = (slug: string) => {
    setOpenVendorSlug(slug);
    update({ panel: "vendor", vendor: slug, task: null, trial: null, agent: null, surface: null });
  };
  const closePanel = () => {
    setOpenVendorSlug(null);
    update({ panel: null, vendor: null, task: null, trial: null });
  };

  useEffect(() => {
    setOpenVendorSlug(queryPanel ? queryVendor : null);
  }, [queryPanel, queryVendor]);

  useEffect(() => {
    if (!panel) return;
    const before = document.activeElement as HTMLElement | null;
    document.body.classList.add("report-open");
    window.requestAnimationFrame(() => dialogRef.current?.focus());
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closePanel(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.classList.remove("report-open"); window.removeEventListener("keydown", onKey); before?.focus(); };
    // The URL is the source of truth; cleanup must run only when the panel opens or closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setShareState("Copied"); }
    catch { setShareState("Select address bar"); }
    window.setTimeout(() => setShareState("Copy link"), 1800);
  };

  const selectedVendor = vendor ? data.editorial.vendors[vendor] : undefined;
  const vendorTrials = useMemo(() => data.trials.task_results.filter((trial) => trial.vendor === vendor), [data.trials.task_results, vendor]);

  return (
    <div className="prototype-shell theme-ledger ledger-progressive">
      <main className="prototype-main">
        <div className="frame ledger-masthead">
          <div><p className="eyebrow">Independent evidence ledger · Database v1</p><h1>AXArena-Database</h1><p className="ledger-deck">The first agent experience benchmark for database products—a vertical view of whether agents can complete real work, verified by live-state read-back.</p></div>
          <div className="ledger-publication"><span className="status-dot" /> Prototype fixture · production deferred <strong>LIVE-STATE VERIFIED</strong></div>
        </div>

        <section className="frame share-card" aria-labelledby="share-verdict">
          <div className="share-card-copy">
            <p className="eyebrow">The cross-configuration verdict</p>
            <h2 id="share-verdict"><span>{data.editorial.vendors[crossHarnessLeader.vendor]?.name}</span> averages {percent(crossHarnessLeader.average)} across tested agent configurations.</h2>
            <p>The bar is the mean across {data.leaderboard.agents.length} pinned harness × model configurations. The whisker shows the full <strong>{percent(crossHarnessLeader.minimum)}–{percent(crossHarnessLeader.maximum)}</strong> range so disagreement stays visible.</p>
            <div className="share-actions"><button className="button" onClick={copyLink}>↗ {shareState}</button><span>Share this exact surface view</span></div>
          </div>
          <div className="share-chart range-chart" aria-label="Cross-configuration average and range for overall usability">
            <div className="range-chart-legend"><span><i className="legend-range" />Min–max range</span><span className="tier-key"><i className="tier-swatch strong" />≥80 Strong</span><span className="tier-key"><i className="tier-swatch mixed" />60–79 Mixed</span><span className="tier-key"><i className="tier-swatch limited" />&lt;60 Limited</span><em>Bar = configuration average</em></div>
            {crossHarnessRows.map((row, index) => <button className="share-chart-row" key={row.vendor} onClick={() => openVendor(row.vendor)}>
              <span className="share-rank">{index + 1}</span><strong>{data.editorial.vendors[row.vendor]?.name}</strong>
              <span className="range-track"><i className={`average-bar tier-${scoreTier(row.average)}`} style={{ width: `${x(row.average)}%` }} /><i className="range-line" style={{ left: `${x(row.minimum)}%`, width: `${x(row.maximum) - x(row.minimum)}%` }} /><b className="range-cap minimum" style={{ left: `${x(row.minimum)}%` }} /><b className="range-cap maximum" style={{ left: `${x(row.maximum)}%` }} /></span>
              <span className="range-value"><strong>{percent(row.average)}</strong><small>{percent(row.minimum)}–{percent(row.maximum)}</small></span>
            </button>)}
          </div>
        </section>

        <section className="frame ledger-results" aria-labelledby="results-title">
          <div className="ledger-results-head"><div><p className="eyebrow">Results</p><h2 id="results-title">Database agent experience, at a glance.</h2></div><p>Rows rank the cross-configuration average. Read right for model and harness variance; select a product for task, trial, prompt, log, and oracle evidence.</p></div>
          <div className="score-band-legend" aria-label="Performance bands"><strong>Performance bands</strong><span><i className="tier-swatch strong" />≥80% <b>Strong</b></span><span><i className="tier-swatch mixed" />60–79% <b>Mixed</b></span><span><i className="tier-swatch limited" />&lt;60% <b>Limited</b></span><em>Thresholds aid reading; exact percentages remain authoritative.</em></div>
          <DenseLeaderboard data={data} onVendor={openVendor} />
          <div className="evidence-section-head"><div><p className="eyebrow">Task-level evidence</p><h3>Seven canonical intents</h3></div><p>Aggregate success across every published harness, model, surface, and three-trial run. Select a product to inspect the complete trial series.</p></div>
          <TaskMatrix data={data} onVendor={openVendor} />
        </section>

        <section className="frame ledger-trust-strip"><span>Batch synthetic…0802</span><span>3 trials / configuration</span><span>Harness + model pins preserved</span><span>Oracle decides outcome</span><Link href="/methodology/">Methodology ↗</Link></section>
      </main>

      {panel && selectedVendor && vendor ? <div className="report-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closePanel(); }}>
        <div className="report-sheet" role="dialog" aria-modal="true" aria-labelledby="report-title" tabIndex={-1} ref={dialogRef}>
          <header className="report-toolbar">
            <button onClick={closePanel}>← Back to results</button>
            <div><button onClick={copyLink}>↗ {shareState}</button><span>Evidence report</span><button className="report-close" aria-label="Close report" onClick={closePanel}>×</button></div>
          </header>
          <div className="report-scroll">
            <VendorReport data={data} vendor={vendor} trials={vendorTrials} />
          </div>
        </div>
      </div> : null}
    </div>
  );
}

function median(values: number[]) {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle]! : (ordered[middle - 1]! + ordered[middle]!) / 2;
}

function MetricCell({ value }: { value: number | null }) {
  const tier = scoreTier(value);
  return <span className={`analysis-metric tier-${tier}`} aria-label={`${percent(value)}${value === null ? "" : ` · ${tier}`}`}><i style={{ width: `${Math.round((value ?? 0) * 100)}%` }} /><strong>{percent(value)}</strong></span>;
}

function DenseLeaderboard({ data, onVendor }: { data: PublicationData; onVendor: (vendor: string) => void }) {
  const summaries = data.publication.cohort.map(({ slug }) => {
    const harnessRows = data.leaderboard.agents.map((configuration) => ({
      configurationId: configuration.configuration_id,
      harness: configuration.harness,
      overall: configuration.views.overall.rows.find((row) => row.vendor === slug)!,
      api: configuration.views.api.rows.find((row) => row.vendor === slug)!,
      cli: configuration.views.cli.rows.find((row) => row.vendor === slug)!,
    }));
    const overall = harnessRows.map(({ overall: row }) => row.mean_pass_at_1);
    const pass3 = harnessRows.map(({ overall: row }) => row.pass_3_rate).filter((value): value is number => value !== null);
    const trials = data.trials.task_results.filter((trial) => trial.vendor === slug);
    const durations = trials.map((trial) => trial.diagnostics.total_duration_ms).filter((value): value is number => value !== null);
    const costs = trials.map((trial) => trial.diagnostics.cost_usd).filter((value): value is number => value !== null);
    return {
      vendor: slug,
      average: overall.reduce((sum, value) => sum + value, 0) / overall.length,
      minimum: Math.min(...overall), maximum: Math.max(...overall),
      pass3: pass3.length ? pass3.reduce((sum, value) => sum + value, 0) / pass3.length : null,
      harnessRows, medianDuration: median(durations), medianCost: median(costs),
    };
  }).sort((left, right) => right.average - left.average);
  return <div className="analysis-table-wrap">
    <table className="analysis-table">
      <thead>
        <tr><th rowSpan={2}>#</th><th rowSpan={2}>Product</th><th colSpan={3}>Cross-configuration context</th>{data.leaderboard.agents.map((configuration) => <th colSpan={3} key={configuration.configuration_id}>{configuration.label ?? configuration.harness}<small>{configuration.model ?? "unpinned model"} · {configuration.harness}</small></th>)}<th colSpan={2}>Diagnostics</th><th rowSpan={2}><span className="sr-only">Evidence</span></th></tr>
        <tr><th>Avg</th><th>Range</th><th>Pass³</th>{data.leaderboard.agents.flatMap((configuration) => [<th key={`${configuration.configuration_id}-overall`}>Overall</th>, <th key={`${configuration.configuration_id}-api`}>API</th>, <th key={`${configuration.configuration_id}-cli`}>CLI</th>])}<th>Time</th><th>Cost</th></tr>
      </thead>
      <tbody>{summaries.map((summary, index) => {
        const meta = data.editorial.vendors[summary.vendor]!;
        return <tr key={summary.vendor}>
          <td className="analysis-rank">{String(index + 1).padStart(2, "0")}</td>
          <td className="analysis-identity"><button onClick={() => onVendor(summary.vendor)}><strong>{meta.name}</strong><small>{meta.descriptor}</small></button></td>
          <td><MetricCell value={summary.average} /></td><td className="analysis-range"><strong>{percent(summary.minimum)}–{percent(summary.maximum)}</strong><small>{Math.round((summary.maximum - summary.minimum) * 100)}pt spread</small></td><td><MetricCell value={summary.pass3} /></td>
          {summary.harnessRows.flatMap((configuration) => [<td key={`${configuration.configurationId}-overall`}><MetricCell value={configuration.overall.mean_pass_at_1} /></td>, <td key={`${configuration.configurationId}-api`}><MetricCell value={configuration.api.mean_pass_at_1} /></td>, <td key={`${configuration.configurationId}-cli`}><MetricCell value={configuration.cli.mean_pass_at_1} /></td>])}
          <td className="analysis-context">{summary.medianDuration === null ? "—" : `${(summary.medianDuration / 1000).toFixed(1)}s`}</td><td className="analysis-context">{summary.medianCost === null ? "—" : `$${summary.medianCost.toFixed(2)}`}</td>
          <td><button className="analysis-open" onClick={() => onVendor(summary.vendor)} aria-label={`Open ${meta.name} evidence report`}>↗</button></td>
        </tr>;
      })}</tbody>
    </table>
    <div className="analysis-table-note"><span>Average and range summarize harness × model configurations; they do not replace stored results.</span><span>Time and cost are diagnostic only · — means unavailable</span></div>
  </div>;
}

function TaskMatrix({ data, onVendor }: { data: PublicationData; onVendor: (vendor: string) => void }) {
  return <div className="ledger-matrix-wrap"><table className="matrix"><thead><tr><th>Canonical task · all configurations</th>{data.publication.cohort.map(({ slug }) => <th key={slug}><button onClick={() => onVendor(slug)}>{data.editorial.vendors[slug]?.name}</button></th>)}</tr></thead><tbody>{data.tasks.tasks.map((task) => <tr key={task.task_id}><td><span className="task-title">{task.title}</span><span className="task-meta">{task.difficulty} · {task.kind}</span></td>{data.publication.cohort.map(({ slug }) => { const results = data.trials.task_results.filter((result) => result.task_id === task.task_id && result.vendor === slug); const scored = results.filter((result) => result.status === "pass" || result.status === "fail"); const rate = scored.length ? scored.filter((result) => result.status === "pass").length / scored.length : null; const exceptions = results.filter((result) => !["pass", "fail"].includes(result.status)).length; const tier = scoreTier(rate); return <td key={slug}><button className={`task-aggregate tier-${tier}`} onClick={() => onVendor(slug)} aria-label={`${data.editorial.vendors[slug]?.name}: ${percent(rate)} success · ${tier} · ${results.length} trials`}><strong>{percent(rate)}</strong><small>{rate === null ? "Unavailable" : tier} · {scored.length} scored{exceptions ? ` · ${exceptions} exceptions` : ""}</small></button></td>; })}</tr>)}</tbody></table></div>;
}

function VendorReport({ data, vendor, trials }: { data: PublicationData; vendor: string; trials: PublicationData["trials"]["task_results"] }) {
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(data.tasks.tasks[0]?.task_id ?? null);
  useEffect(() => {
    if (!selectedTrialId) return;
    window.requestAnimationFrame(() => document.getElementById(`inline-${selectedTrialId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [selectedTrialId]);
  const meta = data.editorial.vendors[vendor]!;
  const overall = data.leaderboard.agents.map((configuration) => configuration.views.overall.rows.find((row) => row.vendor === vendor)!).filter(Boolean);
  const api = data.leaderboard.agents.map((configuration) => configuration.views.api.rows.find((row) => row.vendor === vendor)!.mean_pass_at_1);
  const cli = data.leaderboard.agents.map((configuration) => configuration.views.cli.rows.find((row) => row.vendor === vendor)!.mean_pass_at_1);
  const average = overall.reduce((sum, row) => sum + row.mean_pass_at_1, 0) / overall.length;
  const consistency = overall.map((row) => row.pass_3_rate).filter((value): value is number => value !== null);
  const apiAverage = api.reduce((sum, value) => sum + value, 0) / api.length;
  const cliAverage = cli.reduce((sum, value) => sum + value, 0) / cli.length;
  return <div className="report-body">
    <section className="report-title"><div className="report-monogram">{meta.name.slice(0, 2).toUpperCase()}</div><div><p className="eyebrow">Cross-configuration evidence report</p><h2 id="report-title">{meta.name}</h2><p>{meta.summary}</p></div></section>
    <section className="report-metrics"><div><span>Average success</span><strong>{percent(average)}</strong><small>{overall.length} harness × model configurations</small></div><div><span>Observed range</span><strong>{percent(Math.min(...overall.map((row) => row.mean_pass_at_1)))}–{percent(Math.max(...overall.map((row) => row.mean_pass_at_1)))}</strong><small>Configuration variance stays visible</small></div><div><span>API ↔ CLI</span><strong>{Math.round((apiAverage - cliAverage) * 100) > 0 ? "+" : ""}{Math.round((apiAverage - cliAverage) * 100)}pt</strong><small>Average surface divergence · Pass³ {percent(consistency.reduce((sum, value) => sum + value, 0) / consistency.length)}</small></div></section>
    <section className="report-section"><div className="report-section-head"><div><p className="eyebrow">Task evidence</p><h3>Every run and all three trials.</h3></div><span>Select a trial to reveal its evidence inline</span></div><div className="task-evidence-list">{data.tasks.tasks.map((task) => {
      const taskTrials = trials.filter((trial) => trial.task_id === task.task_id);
      const scored = taskTrials.filter((trial) => ["pass", "fail"].includes(trial.status));
      const rate = scored.length ? scored.filter((trial) => trial.status === "pass").length / scored.length : null;
      return <details key={task.task_id} open={openTaskId === task.task_id} onToggle={(event) => { if (event.currentTarget.open) setOpenTaskId(task.task_id); else if (openTaskId === task.task_id) setOpenTaskId(null); }} className="task-evidence-item"><summary><span><strong>{task.title}</strong><small>{task.difficulty} · {task.kind} · {task.intent}</small></span><span><b>{percent(rate)}</b><small>{scored.length} scored trials</small></span></summary><div className="run-grid">{data.leaderboard.agents.flatMap((configuration) => (["api", "cli"] as const).map((surface) => {
        const runTrials = taskTrials.filter((trial) => trial.configuration_id === configuration.configuration_id && trial.surface === surface).sort((left, right) => left.trial - right.trial);
        const selectedTrial = runTrials.find((trial) => trial.id === selectedTrialId);
        return <div className={`run-entry${selectedTrial ? " evidence-open" : ""}`} key={`${configuration.configuration_id}-${surface}`}><div className="run-row"><div className="run-identity"><strong>{configuration.model}</strong><small>{configuration.label ?? configuration.harness} · {surface.toUpperCase()}</small></div><div className="run-trials">{runTrials.length ? runTrials.map((trial) => <button className={`trial-pill ${trial.status}`} aria-pressed={selectedTrialId === trial.id} key={trial.id} onClick={() => setSelectedTrialId(selectedTrialId === trial.id ? null : trial.id)}><span>T{trial.trial}</span><strong>{selectedTrialId === trial.id ? "Evidence open ↓" : statusLabel[trial.status]}</strong></button>) : <span className="status-chip missing">Missing</span>}</div></div>{selectedTrial ? <TrialEvidence data={data} task={task} trial={selectedTrial} /> : null}</div>;
      }))}</div></details>;
    })}</div></section>
    <section className="report-footnotes"><div><strong>Product record</strong><p>{meta.descriptor} · <a href={meta.url}>Official site ↗</a></p></div><div><strong>Limitations</strong><p>{meta.limitations.join(" ")}</p></div></section>
  </div>;
}

function TrialEvidence({ data, task, trial }: { data: PublicationData; task: PublicationData["tasks"]["tasks"][number]; trial: PublicationData["trials"]["task_results"][number] }) {
  const refs = trial.evidence_refs.map((id) => data.evidence.evidence.find((item) => item.id === id)).filter(Boolean);
  const verified = trial.oracle_results.length ? trial.oracle_results.every((result) => result.passed) : null;
  return <section id={`inline-${trial.id}`} className="trial-evidence" aria-label={`Trial ${trial.trial} evidence`}><div className="trial-evidence-head"><div><p className="eyebrow">Trial {trial.trial} · {trial.surface.toUpperCase()} · {trial.harness}</p><h4>{trial.model}</h4></div><span className={`status-chip ${trial.status}`}>{verified === null ? statusLabel[trial.status] : verified ? "Verified pass" : "Verified fail"}</span></div><div className="trial-evidence-grid"><div className="trial-primary"><section className="evidence-block"><div className="evidence-block-head"><strong>Prompt</strong><span>sha256:{trial.prompt.sha256.slice(0, 12)}… · {trial.prompt.redaction_status}</span></div><pre>{trial.prompt.text}</pre></section><section className="evidence-block"><div className="evidence-block-head"><strong>Sanitized execution log</strong><span>{trial.execution_log.length} events · diagnostic only</span></div><ol className="execution-log">{trial.execution_log.map((event) => <li key={event.sequence}><span>+{(event.offset_ms / 1000).toFixed(1)}s</span><div><strong>{event.kind}{event.tool ? ` · ${event.tool}` : ""}</strong><p>{event.summary}</p>{event.command ? <code>{event.command}</code> : null}</div><em>{event.status}</em></li>)}</ol></section>{trial.output.assistant_summary || trial.output.stdout_excerpt || trial.output.stderr_excerpt ? <section className="evidence-block"><div className="evidence-block-head"><strong>Agent output</strong><span>redacted excerpt</span></div>{trial.output.assistant_summary ? <p>{trial.output.assistant_summary}</p> : null}{trial.output.stdout_excerpt ? <pre>{trial.output.stdout_excerpt}</pre> : null}{trial.output.stderr_excerpt ? <pre className="stderr">{trial.output.stderr_excerpt}</pre> : null}</section> : null}</div><aside className="trial-secondary"><section className="oracle-ledger"><div className="oracle-ledger-head"><span>LIVE-STATE ORACLE</span><strong className={verified === false ? "fail" : ""}>{verified === null ? statusLabel[trial.status] : verified ? "Verified" : "Failed"}</strong></div>{trial.oracle_results.length ? trial.oracle_results.map((result, index) => <div className="oracle-line" key={index}><strong>{result.type.replaceAll("_", " ")}</strong><p>{result.detail}</p></div>) : <div className="oracle-line"><strong>No oracle result</strong><p>This run is explicitly {statusLabel[trial.status].toLowerCase()}.</p></div>}</section><p className="eyebrow">Journey</p><div className="journey-track compact">{trial.journey.map((step) => <div className="journey-node" data-status={step.status} key={step.phase}><span>{step.phase}</span><strong>{step.status.replaceAll("_", " ")}</strong></div>)}</div><dl className="metadata"><div><dt>Configuration</dt><dd>{trial.configuration_id}</dd></div><div><dt>Task</dt><dd>{task.task_id}</dd></div><div><dt>Duration</dt><dd>{trial.diagnostics.total_duration_ms === null ? "—" : `${(trial.diagnostics.total_duration_ms / 1000).toFixed(1)}s`}</dd></div><div><dt>Tool calls</dt><dd>{trial.diagnostics.tool_call_count ?? "—"}</dd></div><div><dt>Tokens</dt><dd>{trial.diagnostics.token_usage === null ? "—" : JSON.stringify(trial.diagnostics.token_usage)}</dd></div><div><dt>Cost</dt><dd>{trial.diagnostics.cost_usd === null ? "—" : `$${trial.diagnostics.cost_usd.toFixed(2)}`}</dd></div><div><dt>Batch</dt><dd>{trial.batch_id}</dd></div><div><dt>Harness version</dt><dd>{trial.harness_version}</dd></div></dl>{refs.map((ref) => ref ? <p className="hash" key={ref.id}>{ref.id}<br />sha256:{ref.sha256?.slice(0, 24)}…</p> : null)}</aside></div></section>;
}
