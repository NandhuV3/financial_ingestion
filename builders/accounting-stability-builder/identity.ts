import { createHash } from "node:crypto";

export function stableRecordId(prefix: string, values: string[]): string {
  const canonical = values.map((value) => `${value.length}:${value}`).join("|");
  const digest = createHash("sha256").update(canonical).digest("hex").slice(0, 20);
  return `${prefix}-${digest}`;
}

