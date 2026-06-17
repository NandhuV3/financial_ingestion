import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { BusinessSignalsArtifactContent, TopicEvolutionArtifactContent } from "../../business-signals-builder/types.js";
import type { CompanyKnowledgeArtifactContent } from "../../company-knowledge-builder/types.js";
import type { QuarterUnderstandingArtifactContent } from "../../quarter-understanding-builder/types.js";
import type { CommitmentTrackingArtifactContent, TrustSignalsArtifactContent } from "../../trust-signals-builder/types.js";
import { artifact, TestArtifactRepository } from "../../business-signals-builder/tests/artifact-fixtures.js";
import type { InvestorIntelligenceBuilderInput } from "../types.js";
import {
  businessSignalsArtifact,
  companyKnowledgeArtifact,
  topicEvolutionArtifact,
  trustSignalsArtifact,
  validQuarterUnderstandingContent,
} from "../../quarter-understanding-builder/tests/quarter-understanding-builder.fixtures.js";

export { artifact, TestArtifactRepository };

export function input(): InvestorIntelligenceBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
  };
}

export function companyKnowledge(): Artifact<CompanyKnowledgeArtifactContent> {
  return companyKnowledgeArtifact();
}

export function businessSignals(): Artifact<BusinessSignalsArtifactContent> {
  return businessSignalsArtifact();
}

export function topicEvolution(): Artifact<TopicEvolutionArtifactContent> {
  return topicEvolutionArtifact();
}

export function trustSignals(): Artifact<TrustSignalsArtifactContent> {
  return trustSignalsArtifact();
}

export function commitmentTracking(): Artifact<CommitmentTrackingArtifactContent> {
  return artifact("commitment-tracking-1", "commitment_tracking", {
    commitments: [
      {
        commitment_id: "commitment-1",
        status: "overdue",
        statement: "Expand AI infrastructure capacity.",
        evidence: [
          {
            evidence_id: "commitment-evidence-1",
            confidence: 0.82,
          },
        ],
        confidence: 0.82,
      },
    ],
    confidence: {
      overall: 0.82,
    },
  });
}

export function quarterUnderstandingBase(): Artifact<QuarterUnderstandingArtifactContent> {
  return artifact("quarter-understanding-1", "quarter_understanding", validQuarterUnderstandingContent());
}

export function quarterUnderstandingWithTrust(): Artifact<QuarterUnderstandingArtifactContent> {
  const content = validQuarterUnderstandingContent();

  content.enrichment_status.trust_signals = {
    available: true,
    artifact_path: "trust-signals-1",
    artifact_version: 1,
    absent_reason: null,
  };
  content.depth_indicator.trust_dimension = "present";
  content.depth_indicator.overall = "standard";
  content.limitations.trust_dimension_gaps = [];
  content.understandings.push({
    understanding_id: "trust:quarter_understanding_interprets_trust_signals:trust_signal_1",
    category: "trust",
    title: "Quarter Understanding interprets trust signals",
    explanation: "Trust interpretation is available through Quarter Understanding.",
    importance: "medium",
    direction: "mixed",
    evidence_package: {
      signal_refs: [],
      company_knowledge_refs: [],
      trust_signal_refs: ["trust-signal-1"],
      topic_refs: [],
    },
  });
  content.evaluation_hooks.depth = content.depth_indicator;
  content.evaluation_hooks.enrichment_status = content.enrichment_status;
  content.evaluation_hooks.understanding_count = content.understandings.length;

  return artifact("quarter-understanding-trust-1", "quarter_understanding", content);
}
