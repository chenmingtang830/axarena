import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const source = process.argv[2];
if (!source) throw new Error("usage: node scripts/stage-local-database-calibration.mjs <ax-eval-export-dir>");
const input = resolve(source, "database-v1.json");
if (!existsSync(input)) throw new Error(`missing sanitized database calibration export: ${input}`);
const target = resolve("data/axarena-local-calibration/database-v1");
mkdirSync(target, { recursive: true, mode: 0o700 });
cpSync(input, resolve(target, "database-v1.json"), { errorOnExist: true });
console.log(`staged local database calibration → ${target}`);
