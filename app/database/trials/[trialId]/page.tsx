import { notFound } from "next/navigation";
import { TrialReceipt } from "@/components/detail-pages";
import { loadSyntheticPublication } from "@/lib/publication-contract";

export function generateStaticParams() { return loadSyntheticPublication().trials.task_results.map(({ id }) => ({ trialId: id })); }
export default async function TrialPage({ params }: { params: Promise<{ trialId: string }> }) { const { trialId } = await params; const data = loadSyntheticPublication(); if (!data.trials.task_results.some(({ id }) => id === trialId)) notFound(); return <TrialReceipt data={data} trialId={trialId} mode="verdict" detailBase="/database" />; }
