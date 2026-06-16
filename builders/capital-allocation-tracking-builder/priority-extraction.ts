import type { CapitalAllocationPriority, CapitalAllocationPriorityInput } from "./types.js";

export function extractCapitalAllocationPriorities(
  inputs: CapitalAllocationPriorityInput[] | undefined,
): CapitalAllocationPriority[] {
  if (!Array.isArray(inputs)) {
    return [];
  }

  return inputs.map((priority) => ({
    priority_id: priority.priority_id,
    priority_type: priority.priority_type,
    description: priority.description,
    evidence_refs: [...priority.evidence_refs],
    filing_refs: [...priority.filing_refs],
  }));
}
