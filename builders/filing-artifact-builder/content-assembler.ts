import { stableHash } from "../investor-intelligence-builder/hashes.js";
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
    sections.management_discussion,
    sections.risk_factors,
  ].join(FILING_SECTION_SEPARATOR);
}

export function calculateFilingHash(filingContent: string): string {
  return stableHash(filingContent);
}
