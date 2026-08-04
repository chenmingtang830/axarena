import { Suspense } from "react";
import { CompareExplorer } from "@/components/compare-explorer";
import { loadSyntheticPublication } from "@/lib/publication-contract";

export default function ComparePage() { return <Suspense fallback={<div className="frame section">Loading comparison…</div>}><CompareExplorer data={loadSyntheticPublication()} mode="verdict" detailBase="/database" /></Suspense>; }
