import type {
  EvidenceCatalogArtifactContent,
} from "../../contracts/artifacts/evidence-catalog-artifact-content.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { buildEvidenceCatalogEntries } from "./catalog-builder.js";
import { EVIDENCE_CATALOG_BUILDER_TYPE } from "./contract.js";
import type { EvidenceCatalogBuilderInput } from "./types.js";
import {
  validateEvidenceCatalogBuildTarget,
  validateEvidenceCatalogBuilderInput,
  validateEvidenceCatalogContent,
  resolveEvidenceCatalogDependencies,
} from "./validator.js";

export class EvidenceCatalogBuilder implements Builder<
  EvidenceCatalogBuilderInput,
  EvidenceCatalogArtifactContent
> {
  builderType(): string {
    return EVIDENCE_CATALOG_BUILDER_TYPE;
  }

  async validateInput(input: EvidenceCatalogBuilderInput): Promise<void> {
    validateEvidenceCatalogBuilderInput(input);
  }

  async execute(
    context: BuilderContext<EvidenceCatalogBuilderInput>,
  ): Promise<BuilderResult<EvidenceCatalogArtifactContent>> {
    validateEvidenceCatalogBuilderInput(context.input);
    validateEvidenceCatalogBuildTarget({
      builderInput: context.input,
      companyId: context.companyId,
      periodId: context.periodId,
    });
    resolveEvidenceCatalogDependencies({
      dependencies: context.dependencies,
      builderInput: context.input,
      companyId: context.companyId,
      periodId: context.periodId,
    });

    const filing = context.input.filing_artifact;
    const content: EvidenceCatalogArtifactContent = {
      artifact_type: "evidence_catalog",
      company_id: context.companyId,
      period_id: context.periodId,
      filing_id: filing.filing_id,
      filing_hash: filing.filing_hash,
      entries: buildEvidenceCatalogEntries(filing),
    };

    validateEvidenceCatalogContent({
      builderInput: context.input,
      content,
      companyId: context.companyId,
      periodId: context.periodId,
    });

    return { content };
  }
}
