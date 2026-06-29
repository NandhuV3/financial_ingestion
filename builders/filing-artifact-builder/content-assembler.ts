import { createHash } from "node:crypto";
import { FILING_SECTION_SEPARATOR } from "./contract.js";
import type {
  FilingSectionContent,
  FilingSectionInput,
} from "./types.js";

export function filingSections(
  input: FilingSectionInput,
): FilingSectionContent {
  return {
    management_discussion: input.management_discussion,
    risk_factors: input.risk_factors,
  };
}

export function assembleFilingContent(input: FilingSectionInput): string {
  const sections = filingSections(input);

  return [
    canonicalizeFilingSection(sections.management_discussion),
    canonicalizeFilingSection(sections.risk_factors),
  ].join(FILING_SECTION_SEPARATOR);
}

export function calculateFilingHash(filingContent: string): string {
  return createHash("sha256").update(filingContent, "utf8").digest("hex");
}

export function canonicalizeFilingSection(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .normalize("NFKC")
    .trim()
    .split(/(?:\n[ \t]*){2,}/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => line.replace(/[ \t]+$/g, ""))
        .join("\n"))
    .join(FILING_SECTION_SEPARATOR);
}
