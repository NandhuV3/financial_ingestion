import type {
  EvidenceIdentityContent,
} from "../../contracts/artifacts/evidence-identity-artifact-content.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { EVIDENCE_IDENTITY_BUILDER_TYPE } from "./contract.js";
import { buildEvidenceIdentityEntries } from "./evidence-builder.js";
import type { EvidenceIdentityBuilderInput } from "./types.js";
import {
  resolveEvidenceIdentityDependencies,
  validateEvidenceIdentityBuilderInput,
  validateEvidenceIdentityBuildTarget,
  validateEvidenceIdentityContent,
} from "./validator.js";

export class EvidenceIdentityBuilder implements Builder<
  EvidenceIdentityBuilderInput,
  EvidenceIdentityContent
> {
  builderType(): string {
    return EVIDENCE_IDENTITY_BUILDER_TYPE;
  }

  async validateInput(input: EvidenceIdentityBuilderInput): Promise<void> {
    validateEvidenceIdentityBuilderInput(input);
  }

  async execute(
    context: BuilderContext<EvidenceIdentityBuilderInput>,
  ): Promise<BuilderResult<EvidenceIdentityContent>> {
    validateEvidenceIdentityBuilderInput(context.input);
    validateEvidenceIdentityBuildTarget({
      builderInput: context.input,
      companyId: context.companyId,
      periodId: context.periodId,
    });
    resolveEvidenceIdentityDependencies({
      dependencies: context.dependencies,
      builderInput: context.input,
      companyId: context.companyId,
      periodId: context.periodId,
    });

    const filing = context.input.filing_artifact;
    const content: EvidenceIdentityContent = {
      filing_id: filing.filing_id,
      filing_hash: filing.filing_hash,
      entries: buildEvidenceIdentityEntries(filing),
    };

    validateEvidenceIdentityContent({
      builderInput: context.input,
      content,
    });

    return { content };
  }
}
