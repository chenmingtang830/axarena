import type { MetadataRoute } from "next";
import { loadSyntheticPublication } from "@/lib/publication-contract";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://axarena.dev"; const data = loadSyntheticPublication();
  const stable = ["/", "/database/", "/database/compare/", "/methodology/", "/reproduce/", "/independence/", "/changelog/", "/data/"];
  const prototype = ["verdict", "ledger", "journey"].map((mode) => `/prototypes/${mode}/`);
  const vendors = data.publication.cohort.map(({ slug }) => `/database/vendors/${slug}/`);
  const tasks = data.tasks.tasks.map(({ task_id }) => `/database/tasks/${task_id}/`);
  return [...stable, ...prototype, ...vendors, ...tasks].map((path) => ({ url: `${base}${path}`, lastModified: new Date(data.publication.generated_at), changeFrequency: "monthly", priority: path === "/database/" ? .9 : .5 }));
}
