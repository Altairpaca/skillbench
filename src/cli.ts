#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createEvidenceBundle, verifyEvidenceBundle } from "./bundle.js";
import { compareHostCompatibility, hostCompatibilityFingerprint, validateHostCompatibility } from "./compatibility.js";
import { evaluateGate } from "./gate.js";
import { compareEvidence, validateSkill } from "./skill.js";
import type { HostCompatibilityRecord } from "./compatibility.js";
import type { EvidenceBundle, GatePolicy, SkillEvidenceReport } from "./contracts.js";

function usage(): never {
  console.error(
    "Usage:\n" +
      "  skillbench validate <SKILL.md>\n" +
      "  skillbench compare <base-report.json> <current-report.json>\n" +
      "  skillbench gate <base-report.json> <current-report.json> [policy.json]\n" +
      "  skillbench bundle <name=report.json> [name=report.json ...]\n" +
      "  skillbench verify-bundle <bundle.json>\n" +
      "  skillbench compat-validate <host-record.json>\n" +
      "  skillbench compat-compare <baseline-records.json> <current-records.json>",
  );
  process.exit(2);
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
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
    const report = compareEvidence(
      await readJson<SkillEvidenceReport>(basePath),
      await readJson<SkillEvidenceReport>(currentPath),
    );
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.compatible ? 0 : 1;
    return;
  }

  if (command === "gate") {
    const [basePath, currentPath, policyPath] = args;
    if (!basePath || !currentPath) usage();
    const base = await readJson<SkillEvidenceReport>(basePath);
    const current = await readJson<SkillEvidenceReport>(currentPath);
    const policy = policyPath ? await readJson<GatePolicy>(policyPath) : {};
    const report = evaluateGate(compareEvidence(base, current), current, policy);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.decision === "pass" ? 0 : 1;
    return;
  }

  if (command === "bundle") {
    if (args.length === 0) usage();
    const payloads: Record<string, unknown> = {};
    for (const arg of args) {
      const separator = arg.indexOf("=");
      if (separator <= 0 || separator === arg.length - 1) usage();
      const name = arg.slice(0, separator);
      const path = arg.slice(separator + 1);
      if (Object.hasOwn(payloads, name)) throw new Error(`duplicate bundle entry name: ${name}`);
      payloads[name] = await readJson<unknown>(path);
    }
    process.stdout.write(`${JSON.stringify(createEvidenceBundle(payloads), null, 2)}\n`);
    return;
  }

  if (command === "verify-bundle") {
    const path = args[0];
    if (!path) usage();
    const result = verifyEvidenceBundle(await readJson<EvidenceBundle>(path));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.valid ? 0 : 1;
    return;
  }

  if (command === "compat-validate") {
    const path = args[0];
    if (!path) usage();
    const record = validateHostCompatibility(await readJson<HostCompatibilityRecord>(path));
    process.stdout.write(`${JSON.stringify({ valid: true, fingerprint: hostCompatibilityFingerprint(record) }, null, 2)}\n`);
    return;
  }

  if (command === "compat-compare") {
    const [basePath, currentPath] = args;
    if (!basePath || !currentPath) usage();
    const base = await readJson<HostCompatibilityRecord[]>(basePath);
    const current = await readJson<HostCompatibilityRecord[]>(currentPath);
    if (!Array.isArray(base) || !Array.isArray(current)) throw new Error("compatibility inputs must be JSON arrays");
    const report = compareHostCompatibility(base, current);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.regressions.length === 0 && report.missingCells.length === 0 ? 0 : 1;
    return;
  }

  usage();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`skillbench: ${message}`);
  process.exitCode = 2;
});
