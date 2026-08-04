import { resolve } from "node:path";
import { validatePublication } from "../lib/publication-contract.ts";

const directory = resolve(process.cwd(), "public/data/axarena-database-v1-synthetic");
const data = validatePublication(directory);
console.log(`validated ${data.publication.display_name}: ${data.trials.task_results.length} trials, ${data.evidence.evidence.length} evidence records`);
