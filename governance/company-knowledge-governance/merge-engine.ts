import type { CandidateChange } from "../../builders/company-knowledge-builder/contract.js";
import type {
  CompanyKnowledge,
  CompanyKnowledgeArtifactContent,
} from "../../builders/company-knowledge-builder/types.js";
import type { PromotionDecision } from "./types.js";

export function buildApprovedCompanyKnowledge(
  current: CompanyKnowledgeArtifactContent | null,
  changes: CandidateChange[],
  decisions: PromotionDecision[],
  companyId: string,
  periodId: string,
): CompanyKnowledgeArtifactContent | null {
  const decisionByField = new Map(decisions.map((decision) => [decision.field_path, decision]));
  const changeByField = new Map(changes.map((change) => [change.field_path, change]));
  const approvedDecisions = decisions.filter((decision) =>
    decision.outcome === "promote" || decision.outcome === "merge");

  if (approvedDecisions.length === 0) {
    return null;
  }

  const baseKnowledge = current === null ? emptyKnowledge() : clone(current.knowledge);

  for (const fieldPath of Object.keys(baseKnowledge) as Array<keyof CompanyKnowledge>) {
    const decision = decisionByField.get(fieldPath);
    const change = changeByField.get(fieldPath);

    if (!decision || !change) {
      continue;
    }

    if (decision.outcome === "promote") {
      baseKnowledge[fieldPath] = clone(change.candidate_value) as never;
    }

    if (decision.outcome === "merge") {
      baseKnowledge[fieldPath] = mergeValues(baseKnowledge[fieldPath], change.candidate_value) as never;
    }
  }

  if (current === null && hasEmptyRequiredField(baseKnowledge)) {
    return null;
  }

  return {
    company_id: companyId,
    period_id: periodId,
    company_knowledge_version: (current?.company_knowledge_version ?? 0) + 1,
    knowledge: baseKnowledge,
    confidence: current?.confidence ?? {
      overall: 0.75,
      evidence_depth: 0.75,
      history_length: 0,
      consistency_score: 0.75,
      governance_confidence: 0.75,
    },
  };
}

function mergeValues(currentValue: unknown, candidateValue: unknown): unknown {
  if (Array.isArray(currentValue) && Array.isArray(candidateValue)) {
    return uniqueValues([...currentValue, ...candidateValue]);
  }

  if (isRecord(currentValue) && isRecord(candidateValue)) {
    return {
      ...currentValue,
      ...candidateValue,
    };
  }

  return candidateValue;
}

function uniqueValues(values: unknown[]): unknown[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = JSON.stringify(value);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function emptyKnowledge(): CompanyKnowledge {
  return {
    business_model: null as never,
    products: [],
    customers: [],
    revenue_structure: null as never,
    revenue_drivers: [],
    competitive_positioning: [],
    strategic_priorities: [],
    management_focus: [],
    dependencies: [],
  };
}

function hasEmptyRequiredField(knowledge: CompanyKnowledge): boolean {
  return knowledge.business_model === null || knowledge.revenue_structure === null;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

