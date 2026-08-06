"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PublicationData } from "@/lib/publication-contract";
import type { PrototypeMode } from "./benchmark-explorer";

export function CompareExplorer({ data, mode, detailBase }: { data: PublicationData; mode: PrototypeMode; detailBase: string }) {
  const search = useSearchParams(); const router = useRouter(); const pathname = usePathname();
  const agent = search.get("agent") === "claude-code" ? "claude-code" : "codex";
  const surface = search.get("surface") === "api" || search.get("surface") === "cli" ? search.get("surface")! : "overall";
  const requested = search.get("vendors")?.split(",").filter((vendor) => data.publication.cohort.some(({ slug }) => slug === vendor)) ?? [];
  const vendors = [...new Set([...requested, ...data.publication.cohort.map(({ slug }) => slug)])].slice(0, 2);
  const set = (key: string, value: string) => { const params = new URLSearchParams(search.toString()); params.set(key, value); router.replace(`${pathname}?${params}`, { scroll: false }); };
  const setVendor = (index: number, value: string) => { const next = [...vendors]; next[index] = value; set("vendors", [...new Set(next)].join(",")); };
  const view = data.leaderboard.agents.find((item) => item.harness === agent)!.views[surface as "overall" | "api" | "cli"];
  return <main className={`prototype-main theme-${mode}`}><section className="detail-hero"><div className="frame"><p className="eyebrow">Database v1 · Side by side</p><h1>Compare the evidence, not a composite grade.</h1><p className="detail-deck">Agent, surface, and vendor choices live in the URL. Scores remain the stored publication values.</p></div></section><div className="frame section" style={{ paddingTop: 34 }}>
    <div className="select-row"><label>Agent<select value={agent} onChange={(event) => set("agent", event.target.value)}><option value="codex">Codex</option><option value="claude-code">Claude Code</option></select></label><label>Surface<select value={surface} onChange={(event) => set("surface", event.target.value)}><option value="overall">Overall</option><option value="api">API</option><option value="cli">CLI</option></select></label>{vendors.map((vendor, index) => <label key={index}>Product {index + 1}<select value={vendor} onChange={(event) => setVendor(index, event.target.value)}>{data.publication.cohort.map(({ slug }) => <option value={slug} key={slug}>{data.editorial.vendors[slug]?.name}</option>)}</select></label>)}</div>
    <div className="compare-grid">{vendors.map((vendor) => { const row = view.rows.find((item) => item.vendor === vendor)!; const meta = data.editorial.vendors[vendor]!; const fails = data.trials.task_results.filter((trial) => trial.vendor === vendor && trial.harness === agent && (surface === "overall" || trial.surface === surface) && trial.status === "fail").length; return <article className="compare-card" key={vendor}><p className="eyebrow">Stored rank #{row.rank}</p><h2>{meta.name}</h2><div className="compare-score">{Math.round(row.mean_pass_at_1 * 100)}%</div><p>{Math.round((row.pass_3_rate ?? 0) * 100)}% pass³ consistency · {fails} failed task trials visible.</p><a className="button secondary" href={`${detailBase}/vendors/${vendor}/?agent=${agent}&surface=${surface}`}>Open evidence →</a></article>; })}</div>
  </div></main>;
}
