"use client";

import { scaleLinear } from "d3-scale";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PublicationData } from "@/lib/publication-contract";

export type PrototypeMode = "verdict" | "ledger" | "journey";
type Agent = "codex" | "claude-code";
type Surface = "overall" | "api" | "cli";

const modeCopy = {
  verdict: {
    eyebrow: "AXArena · Database v1",
    title: "Which products can agents actually use?",
    deck: "A verdict built from completed sandbox work—not documentation claims. Switch the agent and surface to see where the answer changes.",
    section: "The verdict changes with the agent.",
    note: "Success is the mean of three independent trials. Consistency is the share of tasks that passed all three. The two harnesses are never merged.",
  },
  ledger: {
    eyebrow: "Independent evidence ledger · No. 001",
    title: "Every claim earns a receipt.",
    deck: "A research ledger that binds each score to its denominator, execution pins, task trials, and live-state oracle evidence.",
    section: "Findings, with provenance attached.",
    note: "Rank is copied from the sealed publication export. This presentation layer validates parity but does not calculate, repair, or combine it.",
  },
  journey: {
    eyebrow: "Agent execution profile · Database v1",
    title: "See where the agent gets stuck.",
    deck: "Discovery, authentication, execution, and verification are separated so product teams can trace friction without confusing process signals with outcomes.",
    section: "Outcome first. Journey second.",
    note: "Journey events explain behavior; they never determine a pass. Only the final live-state oracle can do that.",
  },
} as const;

const statusLabel: Record<string, string> = {
  pass: "pass", fail: "fail", na: "N/A", structural_na: "N/A", missing: "missing", blocked: "blocked", unclassified: "unclassified",
};

function Controls({ agent, surface }: { agent: Agent; surface: Surface }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  return (
    <div className="control-bar" aria-label="Benchmark controls">
      <div className="control-context">Stored views · shareable URL</div>
      <div className="control-groups">
        <div className="segmented" role="group" aria-label="Agent harness">
          <button aria-pressed={agent === "codex"} onClick={() => setParam("agent", "codex")}>Codex</button>
          <button aria-pressed={agent === "claude-code"} onClick={() => setParam("agent", "claude-code")}>Claude Code</button>
        </div>
        <div className="segmented" role="group" aria-label="Product surface">
          {(["overall", "api", "cli"] as const).map((item) => (
            <button key={item} aria-pressed={surface === item} onClick={() => setParam("surface", item)}>{item === "overall" ? "Overall" : item.toUpperCase()}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DotPlot({ rows, vendorMeta, detailBase, agent, surface }: {
  rows: PublicationData["leaderboard"]["agents"][number]["views"]["overall"]["rows"];
  vendorMeta: PublicationData["editorial"]["vendors"];
  detailBase: string;
  agent: Agent;
  surface: Surface;
}) {
  const x = scaleLinear().domain([0, 1]).range([0, 100]);
  return (
    <div className="leaderboard-card">
      <div className="leaderboard-head"><span>Rank</span><span>Product</span><span>Mean success</span><span>Score</span><span>Pass³</span></div>
      {rows.map((row) => (
        <Link className="rank-row" href={`${detailBase}/vendors/${row.vendor}/?agent=${agent}&surface=${surface}`} key={row.vendor}>
          <span className="rank-number">{String(row.rank).padStart(2, "0")}</span>
          <span className="vendor-name">{vendorMeta[row.vendor]?.name ?? row.vendor}<small className="vendor-descriptor">{vendorMeta[row.vendor]?.descriptor}</small></span>
          <span className="dot-track" aria-label={`${Math.round(row.mean_pass_at_1 * 100)} percent mean success`}><span className="dot-line" style={{ width: `${x(row.mean_pass_at_1)}%` }} /><span className="dot" style={{ left: `${x(row.mean_pass_at_1)}%` }} /></span>
          <span className="score">{Math.round(row.mean_pass_at_1 * 100)}%</span>
          <span className="consistency">{row.pass_3_rate === null ? "—" : `${Math.round(row.pass_3_rate * 100)}%`}</span>
        </Link>
      ))}
    </div>
  );
}

function TrialGlyph({ results, href }: { results: PublicationData["trials"]["task_results"]; href: string }) {
  const ordered = [...results].sort((a, b) => a.trial - b.trial);
  const exceptional = ordered.find((result) => ["na", "structural_na", "missing", "blocked"].includes(result.status));
  return (
    <Link className="trial-glyph" href={href} aria-label={ordered.map((result) => `Trial ${result.trial}: ${statusLabel[result.status]}`).join(", ")}>
      {ordered.map((result) => <span className={`trial-dot ${result.status}`} key={result.id} />)}
      {exceptional ? <span className="trial-text">{statusLabel[exceptional.status]}</span> : null}
    </Link>
  );
}

function TaskMatrix({ data, agent, surface, detailBase }: { data: PublicationData; agent: Agent; surface: Surface; detailBase: string }) {
  const scopedSurface = surface === "overall" ? "api" : surface;
  return (
    <>
      <div className="matrix-wrap">
        <table className="matrix">
          <thead><tr><th>Canonical task · {surface === "overall" ? "API shown" : surface.toUpperCase()}</th>{data.publication.cohort.map(({ slug }) => <th key={slug}>{data.editorial.vendors[slug]?.name ?? slug}</th>)}</tr></thead>
          <tbody>
            {data.tasks.tasks.map((task) => (
              <tr key={task.task_id}>
                <td><Link href={`${detailBase}/tasks/${task.task_id}/?agent=${agent}&surface=${surface}`}><span className="task-title">{task.title}</span><span className="task-meta">{task.difficulty} · {task.kind}</span></Link></td>
                {data.publication.cohort.map(({ slug }) => {
                  const results = data.trials.task_results.filter((result) => result.task_id === task.task_id && result.vendor === slug && result.harness === agent && result.surface === scopedSurface);
                  const target = results.find((result) => result.oracle_results.length) ?? results[0];
                  return <td key={slug}>{target ? <TrialGlyph results={results} href={`${detailBase}/trials/${target.id}/?agent=${agent}&surface=${surface}`} /> : <span className="status-chip missing">missing</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend" aria-label="Result legend">
        <span><i className="trial-dot pass" />Pass</span><span><i className="trial-dot fail" />Fail</span><span><i className="trial-dot na" />Structural N/A</span><span><i className="trial-dot missing" />Missing</span><span><i className="trial-dot blocked" />Blocked</span>
      </div>
    </>
  );
}

function JourneyOverview() {
  return (
    <div className="journey-overview" aria-label="Diagnostic journey phases">
      {["Discovery", "Authentication", "Execution", "Verification"].map((phase, index) => (
        <div className="journey-phase" key={phase}><span className="phase-rate">0{index + 1} · DIAGNOSTIC</span><strong>{phase}</strong><small>{index === 3 ? "Oracle remains authoritative" : "Trace-derived projection"}</small></div>
      ))}
    </div>
  );
}

export function BenchmarkExplorer({ data, mode, detailBase }: { data: PublicationData; mode: PrototypeMode; detailBase: string }) {
  const search = useSearchParams();
  const agent: Agent = search.get("agent") === "claude-code" ? "claude-code" : "codex";
  const surface: Surface = search.get("surface") === "api" || search.get("surface") === "cli" ? search.get("surface") as Surface : "overall";
  const agentData = data.leaderboard.agents.find((item) => item.harness === agent)!;
  const rows = agentData.views[surface].rows;
  const leader = rows[0]!;
  const runnerUp = rows[1]!;
  const other = data.leaderboard.agents.find((item) => item.harness !== agent)!;
  const copy = modeCopy[mode];
  const leaderName = data.editorial.vendors[leader.vendor]?.name ?? leader.vendor;
  const otherLeader = data.editorial.vendors[other.views[surface].rows[0]!.vendor]?.name ?? other.views[surface].rows[0]!.vendor;
  return (
    <div className={`prototype-shell theme-${mode}`}>
      <main className="prototype-main">
        <div className="frame">
          <section className="hero">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <p className="hero-copy">{copy.deck}</p>
            </div>
            <aside className="hero-aside" aria-label="Publication scope">
              {mode === "ledger" ? <div className="ledger-stamp">Evidence-linked</div> : null}
              <div className="status-line"><span className="status-dot" />Prototype fixture · production deferred</div>
              <div className="hero-stat"><span>Canonical tasks</span><strong>{data.publication.scope.task_count}</strong></div>
              <div className="hero-stat"><span>Independent trials</span><strong>3×</strong></div>
              <div className="hero-stat"><span>Surfaces</span><strong>API / CLI</strong></div>
              <div className="hero-stat"><span>Evidence authority</span><strong>LIVE STATE</strong></div>
              {mode === "ledger" ? <div className="ledger-meta"><div><span>Batch</span>synthetic…0802</div><div><span>Gate</span>3 / 3 resolved</div></div> : null}
            </aside>
          </section>
          <section className="section" id="verdict">
            <div className="section-head"><div><p className="eyebrow">01 · Verdict</p><h2>{copy.section}</h2></div><p className="section-note">{copy.note}</p></div>
            <Controls agent={agent} surface={surface} />
            {mode === "journey" ? <JourneyOverview /> : null}
            <div className="metric-grid" style={{ marginTop: mode === "journey" ? 18 : 0 }}>
              <div className="metric-card"><span className="metric-label">Leader · {agentData.label ?? agent}</span><strong className="metric-value">{leaderName}</strong><span className="metric-detail">Stored rank #1 · {Math.round(leader.mean_pass_at_1 * 100)}% mean success</span></div>
              <div className="metric-card"><span className="metric-label">Lead over #2</span><strong className="metric-value">+{Math.round((leader.mean_pass_at_1 - runnerUp.mean_pass_at_1) * 100)}pt</strong><span className="metric-detail">Within this agent + surface view</span></div>
              <div className="metric-card"><span className="metric-label">Agent rank reversal</span><strong className="metric-value">{otherLeader}</strong><span className="metric-detail">Leads when switched to {other.label ?? other.harness}</span></div>
            </div>
            <DotPlot rows={rows} vendorMeta={data.editorial.vendors} detailBase={detailBase} agent={agent} surface={surface} />
          </section>
          <section className="section" id="tasks">
            <div className="section-head"><div><p className="eyebrow">02 · Difference</p><h2>Seven intents. Every trial visible.</h2></div><p className="section-note">Each dot is one clean-environment trial. Overall uses the stored overall leaderboard; the matrix shows API by default so no hidden surface average is implied.</p></div>
            <TaskMatrix data={data} agent={agent} surface={surface} detailBase={detailBase} />
          </section>
          <section className="proof-band">
            <p className="eyebrow">03 · Proof & trust</p>
            <h2>From any score to the oracle receipt in two clicks.</h2>
            <div className="proof-grid">
              <div className="proof-item"><span className="proof-index">01 / IDENTITY</span><strong>Canonical intent</strong><p>Same goal-level task across every applicable product surface.</p></div>
              <div className="proof-item"><span className="proof-index">02 / EXECUTION</span><strong>Pinned agent</strong><p>Model, effort, harness version, and clean namespace travel with the record.</p></div>
              <div className="proof-item"><span className="proof-index">03 / VERIFICATION</span><strong>Live-state oracle</strong><p>Read-back evidence—not stdout or agent self-report—decides success.</p></div>
              <div className="proof-item"><span className="proof-index">04 / INTEGRITY</span><strong>SHA-256 receipt</strong><p>Stable evidence IDs resolve to public paths and sealed hashes.</p></div>
            </div>
          </section>
          <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <Link className="button" href={`${detailBase}/compare/?agent=${agent}&surface=${surface}&vendors=${rows.slice(0, 2).map(({ vendor }) => vendor).join(",")}`}>Compare products →</Link>
            <Link className="button secondary" href="/methodology/">Read methodology</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
