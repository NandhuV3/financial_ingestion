import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import { BuilderDependencyError } from "../../packages/builder-framework/src/builder-errors.js";
import type {
  NarrativeBuildDependencies,
  NarrativeConsistencyArtifactContent,
  NarrativeConsistencyBuilderInput,
  NarrativeSourceArtifactContent,
} from "./types.js";
import { isPeriodAfter, isPeriodBefore } from "./period.js";

export function resolveNarrativeDependencies(
  context: BuilderContext<NarrativeConsistencyBuilderInput>,
): NarrativeBuildDependencies {
  const sources = [];
  const missingPeriods = [];

  for (const declaration of context.input.source_dependencies) {
    const artifact = context.dependencies[declaration.dependency_name];

    if (artifact === undefined) {
      if (declaration.absent_reason === null || declaration.absent_reason.trim() === "") {
        throw new BuilderDependencyError(
          `Missing Narrative Consistency source ${declaration.dependency_name} requires absent_reason.`,
        );
      }
      missingPeriods.push({
        period_id: declaration.period_id,
        absent_reason: declaration.absent_reason,
      });
      continue;
    }

    if (artifact.identity.artifact_type !== declaration.artifact_type) {
      throw new BuilderDependencyError(
        `Narrative Consistency source ${declaration.dependency_name} must be ${declaration.artifact_type}.`,
      );
    }

    if (artifact.identity.company_id !== context.input.company_id) {
      throw new BuilderDependencyError(
        `Narrative Consistency source ${declaration.dependency_name} company is invalid.`,
      );
    }

    if (artifact.identity.period_id !== declaration.period_id) {
      throw new BuilderDependencyError(
        `Narrative Consistency source ${declaration.dependency_name} period is invalid.`,
      );
    }

    if (isPeriodAfter(declaration.period_id, context.input.period_id)) {
      throw new BuilderDependencyError(
        `Narrative Consistency source ${declaration.dependency_name} cannot be after the target period.`,
      );
    }

    if (declaration.absent_reason !== null) {
      throw new BuilderDependencyError(
        `Available Narrative Consistency source ${declaration.dependency_name} must not provide absent_reason.`,
      );
    }

    sources.push({
      declaration,
      artifact: artifact as Artifact<NarrativeSourceArtifactContent>,
    });
  }

  if (!sources.some(({ declaration }) => declaration.period_id === context.input.period_id)) {
    throw new BuilderDependencyError(
      "Narrative Consistency requires an available current-period source.",
    );
  }

  const prior = context.dependencies.prior_narrative_consistency;
  if (prior !== undefined && prior.identity.artifact_type !== "narrative_consistency") {
    throw new BuilderDependencyError(
      "prior_narrative_consistency must be narrative_consistency.",
    );
  }

  if (prior !== undefined && prior.identity.company_id !== context.input.company_id) {
    throw new BuilderDependencyError(
      "Prior Narrative Consistency artifact company is invalid.",
    );
  }

  if (
    prior !== undefined
    && (
      prior.identity.period_id === null
      || prior.identity.period_id !== (
        prior as Artifact<NarrativeConsistencyArtifactContent>
      ).content.period
    )
  ) {
    throw new BuilderDependencyError(
      "Prior Narrative Consistency identity period must match its content period.",
    );
  }

  if (
    prior !== undefined
    && !isPeriodBefore(
      (prior as Artifact<NarrativeConsistencyArtifactContent>).content.period,
      context.input.period_id,
    )
  ) {
    throw new BuilderDependencyError(
      "Prior Narrative Consistency artifact must precede the target period.",
    );
  }

  return {
    sources: sources.sort(
      (left, right) => left.declaration.period_id.localeCompare(right.declaration.period_id)
        || left.artifact.identity.artifact_id.localeCompare(right.artifact.identity.artifact_id),
    ),
    missing_periods: missingPeriods.sort(
      (left, right) => left.period_id.localeCompare(right.period_id),
    ),
    prior: prior as Artifact<NarrativeConsistencyArtifactContent> | undefined ?? null,
  };
}
