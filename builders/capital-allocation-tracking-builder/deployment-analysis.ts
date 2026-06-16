import type { CapitalDeployment, CapitalDeploymentInput } from "./types.js";

export function analyzeCapitalDeployments(
  inputs: CapitalDeploymentInput[] | undefined,
): CapitalDeployment[] {
  if (!Array.isArray(inputs)) {
    return [];
  }

  return inputs.map((deployment) => ({
    deployment_id: deployment.deployment_id,
    deployment_type: deployment.deployment_type,
    amount: deployment.amount,
    evidence_refs: [...deployment.evidence_refs],
    filing_refs: [...deployment.filing_refs],
    financial_statement_refs: [...deployment.financial_statement_refs],
  }));
}
