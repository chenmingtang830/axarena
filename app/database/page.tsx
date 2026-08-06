import { Suspense } from "react";
import { LedgerExplorer } from "@/components/ledger-explorer";
import { loadSyntheticPublication } from "@/lib/publication-contract";

export default function DatabasePage() {
  return <Suspense fallback={<div className="frame section">Loading sealed views…</div>}><LedgerExplorer data={loadSyntheticPublication()} /></Suspense>;
}
