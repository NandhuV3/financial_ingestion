import type {
  CapitalAllocationGap,
  CapitalAllocationPriority,
  CapitalDeployment,
} from "./types.js";

export function analyzeCapitalAllocationGaps(
  priorities: CapitalAllocationPriority[],
  deployments: CapitalDeployment[],
): CapitalAllocationGap[] {
  const gaps: CapitalAllocationGap[] = [];

  for (const priority of priorities) {
    const matchingDeployments = deployments.filter((deployment) =>
      deployment.deployment_type === priority.priority_type);

    if (matchingDeployments.length === 0) {
      gaps.push(buildGap({
        gapType: "under_supported",
        priorityRefs: [priority.priority_id],
        deploymentRefs: [],
        evidenceRefs: priority.evidence_refs,
        explanation: `Stated capital priority has no observed deployment in the current financial statements: ${priority.description}`,
      }));
      continue;
    }

    for (const deployment of matchingDeployments) {
      gaps.push(buildGap({
        gapType: "aligned",
        priorityRefs: [priority.priority_id],
        deploymentRefs: [deployment.deployment_id],
        evidenceRefs: [...priority.evidence_refs, ...deployment.evidence_refs],
        explanation: `Observed deployment aligns with stated capital priority: ${priority.description}`,
      }));
    }
  }

  for (const deployment of deployments) {
    const hasPriority = priorities.some((priority) => priority.priority_type === deployment.deployment_type);

    if (!hasPriority) {
      gaps.push(buildGap({
        gapType: "unsupported_deployment",
        priorityRefs: [],
        deploymentRefs: [deployment.deployment_id],
        evidenceRefs: deployment.evidence_refs,
        explanation: "Observed capital deployment has no matching stated capital priority.",
      }));
    }
  }

  if (priorities.length > 0 && deployments.length === 0) {
    gaps.push(buildGap({
      gapType: "insufficient_evidence",
      priorityRefs: priorities.map((priority) => priority.priority_id),
      deploymentRefs: [],
      evidenceRefs: priorities.flatMap((priority) => priority.evidence_refs),
      explanation: "Capital allocation priorities exist, but deployment evidence is unavailable.",
    }));
  }

  return gaps;
}

function buildGap(input: {
  gapType: CapitalAllocationGap["gap_type"];
  priorityRefs: string[];
  deploymentRefs: string[];
  evidenceRefs: string[];
  explanation: string;
}): CapitalAllocationGap {
  return {
    gap_id: stableGapId(input.gapType, input.priorityRefs, input.deploymentRefs),
    gap_type: input.gapType,
    priority_refs: [...input.priorityRefs],
    deployment_refs: [...input.deploymentRefs],
    evidence_refs: [...new Set(input.evidenceRefs)],
    explanation: input.explanation,
  };
}

function stableGapId(
  gapType: CapitalAllocationGap["gap_type"],
  priorityRefs: string[],
  deploymentRefs: string[],
): string {
  const priorityPart = priorityRefs.length > 0 ? priorityRefs.join("-") : "no-priority";
  const deploymentPart = deploymentRefs.length > 0 ? deploymentRefs.join("-") : "no-deployment";

  return `${gapType}:${priorityPart}:${deploymentPart}`;
}
