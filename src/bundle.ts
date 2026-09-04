import { createHash } from "node:crypto";
import {
  BUNDLE_SCHEMA_VERSION,
  type BundleVerification,
  type EvidenceBundle,
  type EvidenceBundleEntry,
} from "./contracts.js";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function canonicalize(value: unknown, ancestors: WeakSet<object> = new WeakSet()): JsonValue {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical evidence JSON cannot contain non-finite numbers");
    return value;
  }
  if (typeof value !== "object") {
    throw new TypeError(`canonical evidence JSON cannot contain ${typeof value}`);
  }

  if (ancestors.has(value)) throw new TypeError("canonical evidence JSON cannot contain cyclic references");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) return value.map((item) => canonicalize(item, ancestors));

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      const name = prototype?.constructor?.name ?? "unknown";
      throw new TypeError(`canonical evidence JSON requires plain objects, received ${name}`);
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item, ancestors)] as const);
    return Object.fromEntries(entries) as { [key: string]: JsonValue };
  } finally {
    ancestors.delete(value);
  }
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

  if (!Array.isArray(bundle.entries) || bundle.entries.length === 0) {
    errors.push("entries must be a non-empty array");
    return { valid: false, errors };
  }

  const names = new Set<string>();
  for (const entry of bundle.entries) {
    if (typeof entry.name !== "string" || !entry.name.trim()) {
      errors.push("entry name must be non-empty");
      continue;
    }
    if (names.has(entry.name)) errors.push(`duplicate entry name: ${entry.name}`);
    names.add(entry.name);

    try {
      const actual = sha256Json(entry.payload);
      if (actual !== entry.sha256) errors.push(`entry digest mismatch: ${entry.name}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`entry is not canonical JSON: ${entry.name}: ${message}`);
    }
  }

  try {
    const expectedBundleDigest = bundleDigest(bundle.entries);
    if (expectedBundleDigest !== bundle.bundleSha256) errors.push("bundle digest mismatch");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`bundle is not canonical JSON: ${message}`);
  }

  return { valid: errors.length === 0, errors };
}
