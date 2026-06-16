import type { CandidateChange } from "../../builders/company-knowledge-builder/contract.js";
import type { PromotionReason } from "./contract.js";

export const PROMOTION_RULES_VERSION = "company-knowledge-governance-rules-v1";

// Locked by Company Knowledge Governance contracts.
export const MINIMUM_PROMOTION_CONFIDENCE = 0.6;
export const FIRST_POPULATION_PROMOTION_CONFIDENCE = 0.75;
export const AUTOMATIC_PROMOTION_CONFIDENCE = 0.8;

const stableFields = new Set([
  "business_model",
  "revenue_structure",
  "products",
]);

const semiStableFields = new Set([
  "revenue_drivers",
  "customers",
  "competitive_positioning",
]);

export function isStableField(fieldPath: string): boolean {
  return stableFields.has(fieldPath);
}

export function isSemiStableField(fieldPath: string): boolean {
  return semiStableFields.has(fieldPath);
}

export function reasonForReview(change: CandidateChange): PromotionReason | null {
  if (change.change_type === "contradiction") {
    return "contradiction_detected";
  }

  if (change.change_type === "major_update") {
    return "change_exceeds_stability_limit";
  }

  if (isStableField(change.field_path)
    && change.change_type !== "no_change"
    && change.change_type !== "new_information") {
    return "stable_field_change";
  }

  return null;
}
