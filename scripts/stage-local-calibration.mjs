import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const source = process.argv[2];
if (!source) throw new Error("usage: node scripts/stage-local-calibration.mjs <ax-eval-export-dir>");
const input = resolve(source, "calibration.json");
if (!existsSync(input)) throw new Error(`missing sanitized calibration export: ${input}`);
const target = resolve("data/axarena-local-calibration");
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(input, resolve(target, "calibration.json"), { errorOnExist: true });
console.log(`staged local calibration → ${target}`);
