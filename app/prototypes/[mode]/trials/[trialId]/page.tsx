import { notFound } from "next/navigation";
import { TrialReceipt } from "@/components/detail-pages";
import type { PrototypeMode } from "@/components/benchmark-explorer";
import { loadSyntheticPublication } from "@/lib/publication-contract";

const modes = ["verdict", "ledger", "journey"] as const;
export function generateStaticParams() { const data = loadSyntheticPublication(); return modes.flatMap((mode) => data.trials.task_results.map(({ id }) => ({ mode, trialId: id }))); }
export default async function PrototypeTrialPage({ params }: { params: Promise<{ mode: string; trialId: string }> }) { const { mode, trialId } = await params; const data = loadSyntheticPublication(); if (!modes.includes(mode as PrototypeMode) || !data.trials.task_results.some(({ id }) => id === trialId)) notFound(); return <TrialReceipt data={data} trialId={trialId} mode={mode as PrototypeMode} detailBase={`/prototypes/${mode}`} />; }
