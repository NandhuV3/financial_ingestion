import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import { BuilderDependencyError } from "../../packages/builder-framework/src/builder-errors.js";
import type {
  AccountingBuildDependencies,
  AccountingSourceArtifactContent,
  AccountingStabilityBuilderInput,
} from "./types.js";

export function resolveAccountingDependencies(
  context: BuilderContext<AccountingStabilityBuilderInput>,
): AccountingBuildDependencies {
  const sources = context.input.source_dependencies.map((declaration) => {
    const artifact = context.dependencies[declaration.dependency_name];

    if (artifact === undefined) {
      throw new BuilderDependencyError(
        `Missing Accounting Stability source ${declaration.dependency_name}.`,
      );
    }
    if (artifact.identity.artifact_type !== declaration.artifact_type) {
      throw new BuilderDependencyError(
        `Accounting Stability source ${declaration.dependency_name} has invalid type.`,
      );
    }
    if (artifact.identity.company_id !== context.input.company_id) {
      throw new BuilderDependencyError(
        `Accounting Stability source ${declaration.dependency_name} has invalid company.`,
      );
    }
    if (artifact.identity.period_id !== declaration.period_id) {
      throw new BuilderDependencyError(
        `Accounting Stability source ${declaration.dependency_name} has invalid period.`,
      );
    }
    if (declaration.period_id.localeCompare(context.input.period_id) > 0) {
      throw new BuilderDependencyError(
        `Accounting Stability source ${declaration.dependency_name} cannot follow the target period.`,
      );
    }

    return {
      declaration,
      artifact: artifact as Artifact<AccountingSourceArtifactContent>,
    };
  }).sort(
    (left, right) =>
      left.declaration.period_id.localeCompare(right.declaration.period_id)
      || left.artifact.identity.artifact_id.localeCompare(
        right.artifact.identity.artifact_id,
      ),
  );

  if (sources.at(-1)?.declaration.period_id !== context.input.period_id) {
    throw new BuilderDependencyError(
      "Accounting Stability requires an available target-period source.",
    );
  }

  return { sources };
}

