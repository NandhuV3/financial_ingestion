import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { ArtifactLineage } from "../../contracts/artifacts/artifact-lineage.js";
import { ArtifactService } from "../../packages/artifact-framework/src/artifact-service.js";
import {
  GOVERNANCE_DECISION_PIPELINE_VERSION,
  GOVERNANCE_DECISION_SCHEMA_VERSION,
} from "./contract.js";
import type { GovernanceDecisionContent } from "./types.js";

export class GovernanceDecisionRepository {
  constructor(private readonly artifactService: ArtifactService) {}

  async save(
    content: GovernanceDecisionContent,
    lineage: ArtifactLineage,
    inputHash: string,
    generatedAt: string,
    artifactId?: string,
  ): Promise<Artifact<GovernanceDecisionContent>> {
    return this.artifactService.createArtifact({
      artifact_id: artifactId,
      artifact_type: "governance_decision",
      company_id: content.company_id,
      period_id: content.period_id,
      content,
      lineage,
      schema_version: GOVERNANCE_DECISION_SCHEMA_VERSION,
      pipeline_version: GOVERNANCE_DECISION_PIPELINE_VERSION,
      input_hash: inputHash,
      generation_duration_ms: 0,
      generated_at: generatedAt,
    });
  }
}
