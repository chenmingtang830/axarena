import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompareExplorer } from "@/components/compare-explorer";
import type { PrototypeMode } from "@/components/benchmark-explorer";
import { loadSyntheticPublication } from "@/lib/publication-contract";

const modes = ["verdict", "ledger", "journey"] as const;
export function generateStaticParams() { return modes.map((mode) => ({ mode })); }
export default async function PrototypeComparePage({ params }: { params: Promise<{ mode: string }> }) { const { mode } = await params; if (!modes.includes(mode as PrototypeMode)) notFound(); return <Suspense fallback={<div className="frame section">Loading comparison…</div>}><CompareExplorer data={loadSyntheticPublication()} mode={mode as PrototypeMode} detailBase={`/prototypes/${mode}`} /></Suspense>; }
