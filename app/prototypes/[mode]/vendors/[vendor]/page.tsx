import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VendorExplorer } from "@/components/vendor-explorer";
import type { PrototypeMode } from "@/components/benchmark-explorer";
import { loadSyntheticPublication } from "@/lib/publication-contract";

const modes = ["verdict", "ledger", "journey"] as const;
export function generateStaticParams() { const data = loadSyntheticPublication(); return modes.flatMap((mode) => data.publication.cohort.map(({ slug }) => ({ mode, vendor: slug }))); }
export default async function PrototypeVendorPage({ params }: { params: Promise<{ mode: string; vendor: string }> }) { const { mode, vendor } = await params; const data = loadSyntheticPublication(); if (!modes.includes(mode as PrototypeMode) || !data.editorial.vendors[vendor]) notFound(); return <Suspense fallback={<div className="frame section">Loading vendor evidence…</div>}><VendorExplorer data={data} vendor={vendor} mode={mode as PrototypeMode} detailBase={`/prototypes/${mode}`} /></Suspense>; }
