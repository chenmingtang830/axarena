import { notFound } from "next/navigation";
import { TaskDetail } from "@/components/detail-pages";
import type { PrototypeMode } from "@/components/benchmark-explorer";
import { loadSyntheticPublication } from "@/lib/publication-contract";

const modes = ["verdict", "ledger", "journey"] as const;
export function generateStaticParams() { const data = loadSyntheticPublication(); return modes.flatMap((mode) => data.tasks.tasks.map(({ task_id }) => ({ mode, task: task_id }))); }
export default async function PrototypeTaskPage({ params }: { params: Promise<{ mode: string; task: string }> }) { const { mode, task } = await params; const data = loadSyntheticPublication(); if (!modes.includes(mode as PrototypeMode) || !data.tasks.tasks.some(({ task_id }) => task_id === task)) notFound(); return <TaskDetail data={data} taskId={task} mode={mode as PrototypeMode} detailBase={`/prototypes/${mode}`} />; }
