import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  TopicAssignmentArtifactContent,
} from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import type { ReservedArtifactId } from "../../packages/artifact-framework/src/artifact-types.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";

export function topicEvolutionArtifactId(input: {
  current: Artifact<TopicAssignmentArtifactContent>;
  historical: Array<Artifact<TopicAssignmentArtifactContent>>;
}): ReservedArtifactId {
  return `topic-evolution-artifact:${stableHash({
    current_topic_assignment: dependencyIdentity(input.current),
    historical_topic_assignments: input.historical
      .map(dependencyIdentity)
      .sort((left, right) =>
        left.period_id.localeCompare(right.period_id)
          || left.artifact_id.localeCompare(right.artifact_id)),
  })}` as ReservedArtifactId;
}

function dependencyIdentity(
  artifact: Artifact<TopicAssignmentArtifactContent>,
): {
  artifact_hash: string;
  artifact_id: string;
  period_id: string;
  registry_version: number;
  version: number;
} {
  return {
    artifact_hash: artifact.metadata.artifact_hash,
    artifact_id: artifact.identity.artifact_id,
    period_id: artifact.content.period_id,
    registry_version: artifact.content.registry_version,
    version: artifact.identity.version,
  };
}
