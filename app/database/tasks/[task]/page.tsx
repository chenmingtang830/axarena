import { notFound } from "next/navigation";
import { TaskDetail } from "@/components/detail-pages";
import { loadSyntheticPublication } from "@/lib/publication-contract";

export function generateStaticParams() { return loadSyntheticPublication().tasks.tasks.map(({ task_id }) => ({ task: task_id })); }
export default async function TaskPage({ params }: { params: Promise<{ task: string }> }) { const { task } = await params; const data = loadSyntheticPublication(); if (!data.tasks.tasks.some(({ task_id }) => task_id === task)) notFound(); return <TaskDetail data={data} taskId={task} mode="verdict" detailBase="/database" />; }
