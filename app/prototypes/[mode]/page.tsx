import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BenchmarkExplorer, type PrototypeMode } from "@/components/benchmark-explorer";
import { LedgerExplorer } from "@/components/ledger-explorer";
import { loadSyntheticPublication } from "@/lib/publication-contract";

const modes = ["verdict", "ledger", "journey"] as const;
export function generateStaticParams() { return modes.map((mode) => ({ mode })); }
export default async function PrototypePage({ params }: { params: Promise<{ mode: string }> }) { const { mode } = await params; if (!modes.includes(mode as PrototypeMode)) notFound(); const data = loadSyntheticPublication(); return <Suspense fallback={<div className="frame section">Loading stored views…</div>}>{mode === "ledger" ? <LedgerExplorer data={data} /> : <BenchmarkExplorer data={data} mode={mode as PrototypeMode} detailBase={`/prototypes/${mode}`} />}</Suspense>; }
