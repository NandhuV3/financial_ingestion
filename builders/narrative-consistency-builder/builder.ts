import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { buildNarrativeConfidence } from "./confidence.js";
import { NARRATIVE_CONSISTENCY_BUILDER_TYPE } from "./contract.js";
import { buildCoverageAndDepth } from "./coverage.js";
import { resolveNarrativeDependencies } from "./dependencies.js";
import { buildPriorityContent } from "./priorities.js";
import { buildNarrativeReplayability } from "./replayability.js";
import { buildLanguageShifts } from "./shifts.js";
import { buildNarrativeSummary } from "./summary.js";
import { buildNarrativeThemes } from "./themes.js";
import type {
  NarrativeConsistencyArtifactContent,
  NarrativeConsistencyBuilderInput,
} from "./types.js";
import {
  validateNarrativeBuilderInput,
  validateNarrativeContent,
  validateNarrativeSourceArtifact,
} from "./validator.js";

export class NarrativeConsistencyBuilder implements Builder<
  NarrativeConsistencyBuilderInput,
  NarrativeConsistencyArtifactContent
> {
  builderType(): string {
    return NARRATIVE_CONSISTENCY_BUILDER_TYPE;
  }

  async validateInput(input: NarrativeConsistencyBuilderInput): Promise<void> {
    validateNarrativeBuilderInput(input);
  }

  async execute(
    context: BuilderContext<NarrativeConsistencyBuilderInput>,
  ): Promise<BuilderResult<NarrativeConsistencyArtifactContent>> {
    const dependencies = resolveNarrativeDependencies(context);

    for (const source of dependencies.sources) {
      validateNarrativeSourceArtifact(source.artifact, source.declaration.dependency_name);
    }

    if (dependencies.prior !== null) {
      validateNarrativeContent(dependencies.prior.content);
    }

    const { coverage, depth } = buildCoverageAndDepth(dependencies);
    const { priorities, timelines } = buildPriorityContent(
      dependencies,
      context.input.period_id,
    );
    const themes = buildNarrativeThemes(dependencies, context.input.period_id);
    const shifts = buildLanguageShifts(dependencies, context.input.period_id);
    const content: NarrativeConsistencyArtifactContent = {
      artifact_type: "narrative_consistency",
      company: context.input.company_id,
      period: context.input.period_id,
      strategic_priorities: priorities,
      narrative_themes: themes,
      language_shifts: shifts,
      priority_timelines: timelines,
      summary: buildNarrativeSummary(priorities, shifts),
      coverage_status: coverage,
      depth_indicator: depth,
      confidence: buildNarrativeConfidence({
        priorities,
        themes,
        shifts,
        depth,
      }),
      replayability_metadata: buildNarrativeReplayability({
        builderInput: context.input,
        dependencies,
        priorities,
        themes,
        shifts,
        timelines,
      }),
    };

    validateNarrativeContent(content);

    return {
      content,
    };
  }
}
