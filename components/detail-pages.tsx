import Link from "next/link";
import type { PublicationData } from "@/lib/publication-contract";
import type { PrototypeMode } from "./benchmark-explorer";

export function TrialReceipt({ data, trialId, mode, detailBase }: { data: PublicationData; trialId: string; mode: PrototypeMode; detailBase: string }) {
  const trial = data.trials.task_results.find((item) => item.id === trialId);
  if (!trial) return null;
  const task = data.tasks.tasks.find((item) => item.task_id === trial.task_id)!;
  const vendor = data.editorial.vendors[trial.vendor]!;
  const refs = trial.evidence_refs.map((id) => data.evidence.evidence.find((item) => item.id === id)!).filter(Boolean);
  const authoritative = trial.oracle_results.length ? trial.oracle_results.every(({ passed }) => passed) : null;
  return (
    <main className={`prototype-main theme-${mode}`}>
      <section className="detail-hero"><div className="frame"><Link className="back-link" href={`${detailBase}/vendors/${trial.vendor}/`}>← {vendor.name} evidence</Link><p className="eyebrow" style={{ marginTop: 34 }}>Oracle receipt · Trial {trial.trial} of 3</p><h1>{task.title}</h1><p className="detail-deck">{task.intent}</p></div></section>
      <div className="frame detail-grid">
        <div>
          <section className="panel receipt">
            <div className="receipt-head"><div><p className="eyebrow">Live-state verification</p><strong>{vendor.name} · {trial.surface.toUpperCase()} · {trial.harness === "codex" ? "Codex" : "Claude Code"}</strong></div><span className={`receipt-status ${authoritative === false ? "fail" : ""}`}>{authoritative === null ? trial.status.replaceAll("_", " ") : authoritative ? "verified pass" : "verified fail"}</span></div>
            {trial.oracle_results.length ? trial.oracle_results.map((oracle, index) => <div className="oracle-result" key={index}><strong>{oracle.type.replaceAll("_", " ")}</strong><p>{oracle.detail}</p></div>) : <div className="oracle-result"><strong>No oracle result</strong><p>The cell is {trial.status.replaceAll("_", " ")}; absence is explicit and never inferred as a pass.</p></div>}
            {trial.error ? <div className="oracle-result"><strong>Redacted error summary</strong><p>{trial.error}</p></div> : null}
          </section>
          <section className="panel"><h2>Agent journey · diagnostic only</h2><div className="journey-track">{trial.journey.map((step) => <div className="journey-node" data-status={step.status} key={step.phase}><span>{step.phase}</span><strong>{step.status.replaceAll("_", " ")}</strong></div>)}</div><p className="section-note" style={{ marginTop: 18 }}>This deterministic projection explains the path. It is excluded from usability scoring.</p></section>
        </div>
        <aside>
          <section className="panel"><h3>Execution pins</h3><dl className="metadata"><div><dt>Trial ID</dt><dd>{trial.id}</dd></div><div><dt>Batch</dt><dd>{trial.batch_id}</dd></div><div><dt>Model</dt><dd>{trial.model}</dd></div><div><dt>Effort</dt><dd>{trial.effort}</dd></div><div><dt>Harness</dt><dd>{trial.harness_version}</dd></div><div><dt>Surface</dt><dd>{trial.surface.toUpperCase()}</dd></div></dl></section>
          <section className="panel"><h3>Efficiency context</h3><dl className="metadata"><div><dt>Duration</dt><dd>{trial.diagnostics.total_duration_ms ? `${(trial.diagnostics.total_duration_ms / 1000).toFixed(1)}s` : "Unavailable"}</dd></div><div><dt>Tool calls</dt><dd>{trial.diagnostics.tool_call_count ?? "Unavailable"}</dd></div><div><dt>Tokens</dt><dd>Unavailable</dd></div><div><dt>Cost</dt><dd>Unavailable · excluded from rank</dd></div></dl></section>
          <section className="panel"><h3>Evidence integrity</h3>{refs.map((item) => <div key={item.id} style={{ marginBottom: 18 }}><span className="status-chip pass">resolved</span><p className="hash">{item.id}<br />sha256:{item.sha256}<br />{item.public_path}</p></div>)}</section>
        </aside>
      </div>
    </main>
  );
}

export function TaskDetail({ data, taskId, mode, detailBase }: { data: PublicationData; taskId: string; mode: PrototypeMode; detailBase: string }) {
  const task = data.tasks.tasks.find((item) => item.task_id === taskId);
  if (!task) return null;
  return (
    <main className={`prototype-main theme-${mode}`}>
      <section className="detail-hero"><div className="frame"><Link className="back-link" href={`${detailBase}/#tasks`}>← Task matrix</Link><p className="eyebrow" style={{ marginTop: 34 }}>{task.difficulty} · {task.kind} · canonical intent</p><h1>{task.title}</h1><p className="detail-deck">{task.intent}</p></div></section>
      <div className="frame section" style={{ paddingTop: 46 }}><div className="section-head"><div><p className="eyebrow">All vendors · harnesses · trials</p><h2>Applicability is part of the result.</h2></div><p className="section-note">Structural N/A, missing, and blocked remain distinct. Neither is silently converted to failure or removed by the frontend.</p></div>
        <div className="matrix-wrap"><table className="matrix"><thead><tr><th>Product / agent / surface</th><th>Trial 1</th><th>Trial 2</th><th>Trial 3</th><th>Proof</th></tr></thead><tbody>{data.publication.cohort.flatMap(({ slug }) => (["codex", "claude-code"] as const).flatMap((harness) => (["api", "cli"] as const).map((surface) => {
          const trials = data.trials.task_results.filter((result) => result.task_id === task.task_id && result.vendor === slug && result.harness === harness && result.surface === surface).sort((a,b) => a.trial-b.trial);
          return <tr key={`${slug}-${harness}-${surface}`}><td><span className="task-title">{data.editorial.vendors[slug]?.name}</span><span className="task-meta">{harness} · {surface}</span></td>{trials.map((trial) => <td key={trial.id}><span className={`status-chip ${trial.status}`}>{trial.status.replaceAll("_", " ")}</span></td>)}<td>{trials[0] ? <Link className="back-link" href={`${detailBase}/trials/${trials[0].id}/`}>Receipt →</Link> : "—"}</td></tr>;
        })))}</tbody></table></div>
      </div>
    </main>
  );
}
