"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PublicationData } from "@/lib/publication-contract";
import type { PrototypeMode } from "./benchmark-explorer";

type Agent = "codex" | "claude-code";
type Surface = "overall" | "api" | "cli";

export function VendorExplorer({ data, vendor, mode, detailBase }: { data: PublicationData; vendor: string; mode: PrototypeMode; detailBase: string }) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const agent: Agent = search.get("agent") === "claude-code" ? "claude-code" : "codex";
  const surface: Surface = search.get("surface") === "api" || search.get("surface") === "cli" ? search.get("surface") as Surface : "overall";
  const update = (key: string, value: string) => {
    const params = new URLSearchParams(search.toString()); params.set(key, value); router.replace(`${pathname}?${params}`, { scroll: false });
  };
  const agentData = data.leaderboard.agents.find((item) => item.harness === agent)!;
  const row = agentData.views[surface].rows.find((item) => item.vendor === vendor)!;
  const api = agentData.views.api.rows.find((item) => item.vendor === vendor)!;
  const cli = agentData.views.cli.rows.find((item) => item.vendor === vendor)!;
  const meta = data.editorial.vendors[vendor]!;
  const scopedSurface = surface === "overall" ? "api" : surface;
  const results = data.trials.task_results.filter((result) => result.vendor === vendor && result.harness === agent && result.surface === scopedSurface);
  const triads = data.tasks.tasks.map((task) => ({ task, trials: results.filter((result) => result.task_id === task.task_id).sort((a, b) => a.trial - b.trial) }));
  const representative = results.find((result) => result.status === "fail") ?? results[0]!;
  return (
    <div className={`prototype-shell theme-${mode}`}>
      <main className="prototype-main">
        <section className="detail-hero"><div className="frame">
          <Link className="back-link" href={`${detailBase}/?agent=${agent}&surface=${surface}`}>← Database leaderboard</Link>
          <p className="eyebrow" style={{ marginTop: 34 }}>{agentData.label ?? agent} · {surface} · stored rank #{row.rank}</p>
          <h1>{meta.name}</h1><p className="detail-deck">{meta.summary}</p>
        </div></section>
        <div className="frame section" style={{ paddingTop: 34 }}>
          <div className="control-bar">
            <div className="control-context">Vendor evidence view</div>
            <div className="control-groups">
              <div className="segmented" role="group" aria-label="Agent harness"><button aria-pressed={agent === "codex"} onClick={() => update("agent", "codex")}>Codex</button><button aria-pressed={agent === "claude-code"} onClick={() => update("agent", "claude-code")}>Claude Code</button></div>
              <div className="segmented" role="group" aria-label="Product surface">{(["overall", "api", "cli"] as const).map((item) => <button key={item} aria-pressed={surface === item} onClick={() => update("surface", item)}>{item === "overall" ? "Overall" : item.toUpperCase()}</button>)}</div>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric-card"><span className="metric-label">Mean success · {surface}</span><strong className="metric-value">{Math.round(row.mean_pass_at_1 * 100)}%</strong><span className="metric-detail">Rank #{row.rank} for {agentData.label ?? agent}</span></div>
            <div className="metric-card"><span className="metric-label">Pass³ consistency</span><strong className="metric-value">{row.pass_3_rate === null ? "—" : `${Math.round(row.pass_3_rate * 100)}%`}</strong><span className="metric-detail">Passed all three independent trials</span></div>
            <div className="metric-card"><span className="metric-label">API ↔ CLI divergence</span><strong className="metric-value">{Math.round((api.mean_pass_at_1 - cli.mean_pass_at_1) * 100) > 0 ? "+" : ""}{Math.round((api.mean_pass_at_1 - cli.mean_pass_at_1) * 100)}pt</strong><span className="metric-detail">API relative to CLI · not a separate grade</span></div>
          </div>
          <div className="detail-grid">
            <div>
              <section className="panel"><h2>Task breakdown</h2><div className="trial-list">
                {triads.map(({ task, trials }) => {
                  const target = trials.find((trial) => trial.oracle_results.length) ?? trials[0];
                  return <Link className="trial-link" href={`${detailBase}/trials/${target.id}/`} key={task.task_id}><span className={`status-chip ${target.status}`}>{target.status === "na" ? "N/A" : target.status}</span><strong>{task.title}</strong><span>{trials.map((trial) => trial.status === "pass" ? "●" : trial.status === "fail" ? "○" : "—").join(" ")}</span></Link>;
                })}
              </div></section>
              <section className="panel"><h2>Representative agent journey</h2><div className="journey-track">{representative.journey.map((step) => <div className="journey-node" data-status={step.status} key={step.phase}><span>{step.phase}</span><strong>{step.status.replaceAll("_", " ")}</strong></div>)}</div><p className="section-note" style={{ marginTop: 18 }}>Trace-derived journey is diagnostic. The linked verification receipt remains authoritative.</p></section>
            </div>
            <aside>
              <section className="panel"><h3>Product record</h3><dl className="metadata"><div><dt>Descriptor</dt><dd>{meta.descriptor}</dd></div><div><dt>Official site</dt><dd><a href={meta.url} rel="noreferrer">{meta.url.replace("https://", "")}</a></dd></div><div><dt>Surfaces</dt><dd>API · CLI</dd></div><div><dt>Trials</dt><dd>3 per task</dd></div><div><dt>Fixture</dt><dd>Synthetic, non-citable</dd></div></dl></section>
              <section className="panel"><h3>Limitations</h3>{meta.limitations.map((item) => <p className="section-note" key={item}>{item}</p>)}</section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
