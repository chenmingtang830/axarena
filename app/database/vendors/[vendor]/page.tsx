import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VendorExplorer } from "@/components/vendor-explorer";
import { loadSyntheticPublication } from "@/lib/publication-contract";

export function generateStaticParams() { return loadSyntheticPublication().publication.cohort.map(({ slug }) => ({ vendor: slug })); }
export default async function VendorPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor } = await params; const data = loadSyntheticPublication();
  if (!data.editorial.vendors[vendor]) notFound();
  return <Suspense fallback={<div className="frame section">Loading vendor evidence…</div>}><VendorExplorer data={data} vendor={vendor} mode="verdict" detailBase="/database" /></Suspense>;
}
