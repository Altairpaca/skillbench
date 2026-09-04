#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { compareEvidence, validateSkill } from "./skill.js";
import type { SkillEvidenceReport } from "./contracts.js";

function usage(): never {
  console.error("Usage:\n  skillbench validate <SKILL.md>\n  skillbench compare <base-report.json> <current-report.json>");
  process.exit(2);
}

async function readJson(path: string): Promise<SkillEvidenceReport> {
  return JSON.parse(await readFile(path, "utf8")) as SkillEvidenceReport;
}

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  if (command === "validate") {
    const path = args[0];
    if (!path) usage();
    const report = validateSkill(await readFile(path, "utf8"), path);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.verdict === "pass" ? 0 : 1;
    return;
  }

  if (command === "compare") {
    const [basePath, currentPath] = args;
    if (!basePath || !currentPath) usage();
    const report = compareEvidence(await readJson(basePath), await readJson(currentPath));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.compatible ? 0 : 1;
    return;
  }

  usage();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`skillbench: ${message}`);
  process.exitCode = 2;
});
