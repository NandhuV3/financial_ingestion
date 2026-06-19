import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import { BuilderDependencyError } from "../../packages/builder-framework/src/builder-errors.js";
import type {
  CommitmentSourceArtifactContent,
  CommitmentTrackingArtifactContent,
  CommitmentTrackingBuildDependencies,
  CommitmentTrackingBuilderInput,
} from "./types.js";

export function resolveCommitmentTrackingDependencies(
  context: BuilderContext<CommitmentTrackingBuilderInput>,
): CommitmentTrackingBuildDependencies {
  const sources = [];
  const missingSources = [];

  for (const declaration of context.input.source_dependencies) {
    const artifact = context.dependencies[declaration.dependency_name];

    if (artifact === undefined) {
      if (declaration.absent_reason === null || declaration.absent_reason.trim() === "") {
        throw new BuilderDependencyError(
          `Missing Commitment Tracking source ${declaration.dependency_name} requires absent_reason.`,
        );
      }

      missingSources.push({
        period_id: declaration.period_id,
        source_type: declaration.source_type,
        absent_reason: declaration.absent_reason,
      });
      continue;
    }

    if (artifact.identity.artifact_type !== declaration.artifact_type) {
      throw new BuilderDependencyError(
        `Commitment Tracking source ${declaration.dependency_name} must be ${declaration.artifact_type}.`,
      );
    }

    if (artifact.identity.company_id !== context.input.company_id) {
      throw new BuilderDependencyError(
        `Commitment Tracking source ${declaration.dependency_name} must belong to ${context.input.company_id}.`,
      );
    }

    if (artifact.identity.period_id !== declaration.period_id) {
      throw new BuilderDependencyError(
        `Commitment Tracking source ${declaration.dependency_name} period must match its declaration.`,
      );
    }

    if (declaration.absent_reason !== null) {
      throw new BuilderDependencyError(
        `Available Commitment Tracking source ${declaration.dependency_name} must not provide absent_reason.`,
      );
    }

    sources.push({
      declaration,
      artifact: artifact as Artifact<CommitmentSourceArtifactContent>,
    });
  }

  if (!sources.some(({ declaration }) => declaration.period_id === context.input.period_id)) {
    throw new BuilderDependencyError(
      "Commitment Tracking requires at least one available current-period source.",
    );
  }

  const priorArtifact = context.dependencies.prior_commitment_tracking;

  if (
    priorArtifact !== undefined
    && priorArtifact.identity.artifact_type !== "commitment_tracking"
  ) {
    throw new BuilderDependencyError(
      "Commitment Tracking dependency prior_commitment_tracking must be commitment_tracking.",
    );
  }

  if (
    priorArtifact !== undefined
    && priorArtifact.identity.company_id !== context.input.company_id
  ) {
    throw new BuilderDependencyError(
      `Commitment Tracking prior artifact must belong to ${context.input.company_id}.`,
    );
  }

  return {
    sources: sources.sort(
      (left, right) => left.declaration.period_id.localeCompare(right.declaration.period_id)
        || left.artifact.identity.artifact_id.localeCompare(right.artifact.identity.artifact_id)
        || left.artifact.identity.version - right.artifact.identity.version,
    ),
    missing_sources: missingSources,
    prior: priorArtifact as Artifact<CommitmentTrackingArtifactContent> | undefined ?? null,
  };
}
