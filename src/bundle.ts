import { createHash } from "node:crypto";
import {
  BUNDLE_SCHEMA_VERSION,
  type BundleVerification,
  type EvidenceBundle,
  type EvidenceBundleEntry,
} from "./contracts.js";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]);
    return Object.fromEntries(entries);
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256Json(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function bundleDigest(entries: EvidenceBundleEntry[]): string {
  return sha256Json({ schemaVersion: BUNDLE_SCHEMA_VERSION, entries });
}

export function createEvidenceBundle(payloads: Record<string, unknown>): EvidenceBundle {
  const names = Object.keys(payloads).sort();
  if (names.length === 0) throw new Error("evidence bundle must contain at least one entry");

  const entries = names.map((name) => {
    if (!name.trim()) throw new Error("evidence bundle entry names must be non-empty");
    const payload = payloads[name];
    return { name, payload, sha256: sha256Json(payload) } satisfies EvidenceBundleEntry;
  });

  return {
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    entries,
    bundleSha256: bundleDigest(entries),
  };
}

export function verifyEvidenceBundle(bundle: EvidenceBundle): BundleVerification {
  const errors: string[] = [];
  if (bundle.schemaVersion !== BUNDLE_SCHEMA_VERSION) {
    errors.push(`schemaVersion must equal ${BUNDLE_SCHEMA_VERSION}`);
  }

  const names = new Set<string>();
  for (const entry of bundle.entries) {
    if (!entry.name.trim()) errors.push("entry name must be non-empty");
    if (names.has(entry.name)) errors.push(`duplicate entry name: ${entry.name}`);
    names.add(entry.name);
    const actual = sha256Json(entry.payload);
    if (actual !== entry.sha256) errors.push(`entry digest mismatch: ${entry.name}`);
  }

  const expectedBundleDigest = bundleDigest(bundle.entries);
  if (expectedBundleDigest !== bundle.bundleSha256) errors.push("bundle digest mismatch");

  return { valid: errors.length === 0, errors };
}
