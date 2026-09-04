import { createHash } from "node:crypto";
import {
  EVIDENCE_SCHEMA_VERSION,
  type RegressionFinding,
  type RegressionReport,
  type SkillCheck,
  type SkillEvidenceReport,
} from "./contracts.js";

interface ParsedSkill {
  hasFrontmatter: boolean;
  frontmatterClosed: boolean;
  fields: Map<string, string>;
  body: string;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseSkill(content: string): ParsedSkill {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { hasFrontmatter: false, frontmatterClosed: false, fields: new Map(), body: normalized };
  }

  const closing = normalized.indexOf("\n---\n", 4);
  if (closing < 0) {
    return { hasFrontmatter: true, frontmatterClosed: false, fields: new Map(), body: "" };
  }

  const header = normalized.slice(4, closing);
  const body = normalized.slice(closing + 5);
  const fields = new Map<string, string>();

  for (const line of header.split("\n")) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (match?.[1] !== undefined && match[2] !== undefined) {
      fields.set(match[1], unquote(match[2]));
    }
  }

  return { hasFrontmatter: true, frontmatterClosed: true, fields, body };
}

function check(id: string, ok: boolean, pass: string, fail: string): SkillCheck {
  return { id, status: ok ? "pass" : "fail", message: ok ? pass : fail };
}

export function validateSkill(content: string, sourcePath = "SKILL.md"): SkillEvidenceReport {
  const parsed = parseSkill(content);
  const name = parsed.fields.get("name")?.trim();
  const description = parsed.fields.get("description")?.trim();

  const checks: SkillCheck[] = [
    check("SB001", parsed.hasFrontmatter, "Frontmatter opening fence found.", "SKILL.md must start with a YAML frontmatter fence."),
    check("SB002", parsed.frontmatterClosed, "Frontmatter closing fence found.", "Frontmatter must have a closing fence."),
    check("SB003", Boolean(name), "Skill name is present.", "Frontmatter must declare a non-empty name."),
    check("SB004", Boolean(description), "Skill description is present.", "Frontmatter must declare a non-empty description."),
    check("SB005", parsed.body.trim().length > 0, "Skill body is non-empty.", "SKILL.md must contain instructions after frontmatter."),
  ];

  if (name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    checks.push({
      id: "SBP001",
      status: "warn",
      message: "Name is valid structurally but is outside SkillBench's portable lowercase-kebab-case profile.",
    });
  }

  const manifest: SkillEvidenceReport["manifest"] = {};
  if (name) manifest.name = name;
  if (description) manifest.description = description;

  return {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    source: {
      path: sourcePath,
      sha256: createHash("sha256").update(content).digest("hex"),
    },
    manifest,
    checks,
    verdict: checks.some((item) => item.status === "fail") ? "fail" : "pass",
  };
}

export function compareEvidence(base: SkillEvidenceReport, current: SkillEvidenceReport): RegressionReport {
  const findings: RegressionFinding[] = [];
  const baseFailures = new Set(base.checks.filter((item) => item.status === "fail").map((item) => item.id));
  const currentFailures = new Set(current.checks.filter((item) => item.status === "fail").map((item) => item.id));

  for (const id of currentFailures) {
    if (!baseFailures.has(id)) {
      findings.push({ kind: "new-failure", id, message: `New failing conformance check: ${id}.` });
    }
  }
  for (const id of baseFailures) {
    if (!currentFailures.has(id)) {
      findings.push({ kind: "resolved-failure", id, message: `Previously failing check resolved: ${id}.` });
    }
  }

  if (base.manifest.name !== current.manifest.name) {
    findings.push({
      kind: "manifest-change",
      id: "manifest.name",
      message: `Skill name changed from ${JSON.stringify(base.manifest.name)} to ${JSON.stringify(current.manifest.name)}.`,
    });
  }

  return {
    schemaVersion: "skillbench.regression/v1",
    compatible: !findings.some((finding) => finding.kind === "new-failure" || finding.kind === "manifest-change"),
    findings,
  };
}
