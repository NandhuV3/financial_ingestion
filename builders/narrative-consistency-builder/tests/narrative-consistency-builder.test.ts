import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { NarrativeConsistencyBuilder } from "../builder.js";
import {
  NARRATIVE_CONSISTENCY_BUILDER_TYPE,
  NARRATIVE_CONSISTENCY_BUILDER_VERSION,
  NARRATIVE_CONSISTENCY_PIPELINE_VERSION,
  NARRATIVE_CONSISTENCY_SCHEMA_VERSION,
} from "../contract.js";
import type {
  NarrativeConsistencyArtifactContent,
  NarrativeConsistencyBuilderInput,
} from "../types.js";
import { validateNarrativeContent } from "../validator.js";
import {
  currentContent,
  currentSource,
  input,
  priorSource,
  TestArtifactRepository,
} from "./narrative-consistency.fixtures.js";

describe("narrative consistency builder", () => {
  it("generates a valid deterministic artifact from two periods", async () => {
    const repository = new TestArtifactRepository();
    const result = await execute(repository, requiredDependencies());

    assert.equal(result.identity.artifact_type, "narrative_consistency");
    assert.equal(result.metadata.schema_version, NARRATIVE_CONSISTENCY_SCHEMA_VERSION);
    assert.equal(result.content.depth_indicator.minimum_history_available, true);
    assert.equal(result.content.depth_indicator.historical_periods_available, 2);
    assert.equal(result.content.coverage_status.status, "complete");
    assert.equal(
      result.content.strategic_priorities.find(
        (priority) => priority.priority_id === "priority-ai",
      )?.current_status,
      "persistent",
    );
    assert.equal(
      result.content.strategic_priorities.find(
        (priority) => priority.priority_id === "priority-cloud",
      )?.current_status,
      "dropped",
    );
    assert.equal(result.content.narrative_themes[0]?.trend, "increasing");
    assert.equal(result.content.language_shifts[0]?.shift_magnitude, "significant");
    assert.equal(result.content.summary.significant_language_shifts, 1);
    assert.deepEqual(await repository.getCurrent({
      artifact_type: "narrative_consistency",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), result);
  });

  it("records a dropped priority and preserves its history", async () => {
    const result = await execute(new TestArtifactRepository(), requiredDependencies());
    const timeline = result.content.priority_timelines.find(
      (item) => item.priority_id === "priority-cloud",
    );

    assert.deepEqual(
      timeline?.periods.map(({ status }) => status),
      ["new", "dropped"],
    );
    assert.deepEqual(
      timeline?.periods.map(({ evidence_refs }) => evidence_refs),
      [["q1:priority-cloud"], ["filing-q2"]],
    );
  });

  it("classifies a previously dropped priority as reintroduced", async () => {
    const first = await execute(new TestArtifactRepository(), requiredDependencies());
    const q3 = currentContent();
    q3.priority_observations.push({
      priority_id: "priority-cloud",
      concept_ref: "cloud_expansion",
      description: "Resume cloud capacity expansion.",
      mention_count: 2,
      evidence_refs: ["q3:priority-cloud"],
      confidence: 0.9,
    });
    const current = currentSource(q3);
    current.identity.artifact_id = "filing-q3";
    current.identity.period_id = "2026-Q3";
    const q3Input = input({
      period_id: "2026-Q3",
      source_dependencies: [
        {
          dependency_name: "current_filing",
          period_id: "2026-Q3",
          artifact_type: "filing",
          absent_reason: null,
        },
      ],
    });
    const result = await execute(
      new TestArtifactRepository(),
      {
        current_filing: current,
        prior_narrative_consistency: first,
      },
      q3Input,
    );

    assert.equal(
      result.content.strategic_priorities.find(
        (priority) => priority.priority_id === "priority-cloud",
      )?.current_status,
      "reintroduced",
    );
  });

  it("fails when fewer than two periods are available", async () => {
    await assert.rejects(
      execute(
        new TestArtifactRepository(),
        { current_filing: currentSource() },
        input({
          source_dependencies: [
            {
              dependency_name: "current_filing",
              period_id: "2026-Q2",
              artifact_type: "filing",
              absent_reason: null,
            },
          ],
        }),
      ),
      BuilderDependencyError,
    );
  });

  it("records partial coverage for declared missing history", async () => {
    const result = await execute(
      new TestArtifactRepository(),
      requiredDependencies(),
      input({
        source_dependencies: [
          ...input().source_dependencies,
          {
            dependency_name: "older_filing",
            period_id: "2025-Q4",
            artifact_type: "filing",
            absent_reason: "Historical filing unavailable.",
          },
        ],
      }),
    );

    assert.equal(result.content.coverage_status.status, "partial");
    assert.deepEqual(result.content.coverage_status.missing_periods, [{
      period_id: "2025-Q4",
      absent_reason: "Historical filing unavailable.",
    }]);
  });

  it("does not rewrite prior history from overlapping historical sources", async () => {
    const prior = await execute(new TestArtifactRepository(), requiredDependencies());
    const historical = priorSource();
    historical.content.priority_observations[0] = {
      ...historical.content.priority_observations[0]!,
      mention_count: 99,
    };
    const q3 = currentSource(currentContent());
    q3.identity.artifact_id = "filing-q3";
    q3.identity.period_id = "2026-Q3";
    const result = await execute(
      new TestArtifactRepository(),
      {
        historical_filing: historical,
        current_filing: q3,
        prior_narrative_consistency: prior,
      },
      input({
        period_id: "2026-Q3",
        source_dependencies: [
          {
            dependency_name: "historical_filing",
            period_id: "2026-Q1",
            artifact_type: "filing",
            absent_reason: null,
          },
          {
            dependency_name: "current_filing",
            period_id: "2026-Q3",
            artifact_type: "filing",
            absent_reason: null,
          },
        ],
      }),
    );
    const aiTimeline = result.content.priority_timelines.find(
      (timeline) => timeline.priority_id === "priority-ai",
    );

    assert.equal(aiTimeline?.periods[0]?.mention_count, 2);
    assert.equal(result.content.depth_indicator.historical_periods_available, 3);
  });

  it("rejects prior artifact period mismatches and future prior artifacts", async () => {
    const prior = await execute(new TestArtifactRepository(), requiredDependencies());
    prior.identity.period_id = "2026-Q1";
    const q3 = currentSource();
    q3.identity.period_id = "2026-Q3";

    await assert.rejects(
      execute(
        new TestArtifactRepository(),
        {
          current_filing: q3,
          prior_narrative_consistency: prior,
        },
        input({
          period_id: "2026-Q3",
          source_dependencies: [{
            dependency_name: "current_filing",
            period_id: "2026-Q3",
            artifact_type: "filing",
            absent_reason: null,
          }],
        }),
      ),
      BuilderDependencyError,
    );

    const future = await execute(new TestArtifactRepository(), requiredDependencies());
    future.identity.period_id = "2026-Q4";
    future.content.period = "2026-Q4";

    await assert.rejects(
      execute(
        new TestArtifactRepository(),
        {
          current_filing: currentSource(),
          prior_narrative_consistency: future,
        },
      ),
      BuilderDependencyError,
    );
  });

  it("breaks persistence across missing periods without fabricating dropped or reintroduced", async () => {
    const q3 = currentSource({
      ...currentContent(),
      priority_observations: [
        {
          priority_id: "priority-ai",
          concept_ref: "ai_growth_acceleration",
          description: "Expand AI infrastructure.",
          mention_count: 4,
          evidence_refs: ["q3:priority-ai"],
          confidence: 0.92,
        },
      ],
    });
    q3.identity.artifact_id = "filing-q3";
    q3.identity.period_id = "2026-Q3";
    const result = await execute(
      new TestArtifactRepository(),
      {
        prior_filing: priorSource(),
        current_filing: q3,
      },
      input({
        period_id: "2026-Q3",
        source_dependencies: [
          {
            dependency_name: "prior_filing",
            period_id: "2026-Q1",
            artifact_type: "filing",
            absent_reason: null,
          },
          {
            dependency_name: "missing_filing",
            period_id: "2026-Q2",
            artifact_type: "filing",
            absent_reason: "Filing unavailable.",
          },
          {
            dependency_name: "current_filing",
            period_id: "2026-Q3",
            artifact_type: "filing",
            absent_reason: null,
          },
        ],
      }),
    );
    const priority = result.content.strategic_priorities.find(
      (item) => item.priority_id === "priority-ai",
    );
    const timeline = result.content.priority_timelines.find(
      (item) => item.priority_id === "priority-ai",
    );

    assert.equal(priority?.current_status, "active");
    assert.equal(priority?.consecutive_periods, 1);
    assert.deepEqual(timeline?.periods.map(({ status }) => status), ["new", "active"]);
  });

  it("rejects unstable priority concept identity", async () => {
    const current = currentContent();
    current.priority_observations[0] = {
      ...current.priority_observations[0]!,
      concept_ref: "different_concept",
    };

    await assert.rejects(
      execute(new TestArtifactRepository(), {
        prior_filing: priorSource(),
        current_filing: currentSource(current),
      }),
      BuilderValidationError,
    );
  });

  it("rejects theme concept and category drift across periods", async () => {
    const current = currentContent();
    current.theme_observations[0] = {
      ...current.theme_observations[0]!,
      concept_ref: "different_concept",
    };

    await assert.rejects(
      execute(new TestArtifactRepository(), {
        prior_filing: priorSource(),
        current_filing: currentSource(current),
      }),
      BuilderValidationError,
    );
  });

  it("rejects source company and period mismatches", async () => {
    const wrongCompany = currentSource();
    wrongCompany.identity.company_id = "AAPL";

    await assert.rejects(
      execute(new TestArtifactRepository(), {
        prior_filing: priorSource(),
        current_filing: wrongCompany,
      }),
      BuilderDependencyError,
    );

    const wrongPeriod = currentSource();
    wrongPeriod.identity.period_id = "2026-Q1";

    await assert.rejects(
      execute(new TestArtifactRepository(), {
        prior_filing: priorSource(),
        current_filing: wrongPeriod,
      }),
      BuilderDependencyError,
    );
  });

  it("rejects summary and replayability mismatches", async () => {
    const result = await execute(new TestArtifactRepository(), requiredDependencies());
    const summaryMismatch = structuredClone(result.content);
    summaryMismatch.summary.dropped_priorities += 1;

    assert.throws(
      () => validateNarrativeContent(summaryMismatch),
      BuilderValidationError,
    );

    const replayMismatch = structuredClone(result.content);
    replayMismatch.replayability_metadata.source_artifact_versions = [];

    assert.throws(
      () => validateNarrativeContent(replayMismatch),
      BuilderValidationError,
    );

    const evidenceMismatch = structuredClone(result.content);
    evidenceMismatch.replayability_metadata.evidence_references = ["unknown-evidence"];

    assert.throws(
      () => validateNarrativeContent(evidenceMismatch),
      BuilderValidationError,
    );

    const confidenceMismatch = structuredClone(result.content);
    confidenceMismatch.confidence.overall = 0;

    assert.throws(
      () => validateNarrativeContent(confidenceMismatch),
      BuilderValidationError,
    );
  });

  it("preserves priority and theme evidence in emitted content", async () => {
    const result = await execute(new TestArtifactRepository(), requiredDependencies());
    const priority = result.content.strategic_priorities.find(
      (item) => item.priority_id === "priority-ai",
    );
    const theme = result.content.narrative_themes.find(
      (item) => item.theme_id === "theme-ai",
    );

    assert.deepEqual(priority?.evidence_refs, ["q1:priority-ai", "q2:priority-ai"]);
    assert.deepEqual(theme?.evidence_refs, ["q1:theme-ai", "q2:theme-ai"]);
    assert.ok(
      result.content.replayability_metadata.evidence_references.includes(
        "q2:priority-ai",
      ),
    );
  });

  it("is stable when source dependency order changes", async () => {
    const first = await execute(new TestArtifactRepository(), requiredDependencies());
    const reversedInput = input({
      source_dependencies: [...input().source_dependencies].reverse(),
    });
    const second = await execute(
      new TestArtifactRepository(),
      requiredDependencies(),
      reversedInput,
    );

    assert.deepEqual(first.content, second.content);
  });

  it("is replayable for identical inputs", async () => {
    const first = await execute(new TestArtifactRepository(), requiredDependencies());
    const second = await execute(new TestArtifactRepository(), requiredDependencies());

    assert.deepEqual(first.content, second.content);
  });
});

function requiredDependencies(): Record<string, Artifact<unknown>> {
  return {
    prior_filing: priorSource(),
    current_filing: currentSource(),
  };
}

async function execute(
  repository: ArtifactRepository,
  dependencies: Record<string, Artifact<unknown>>,
  builderInput: NarrativeConsistencyBuilderInput = input(),
): Promise<Artifact<NarrativeConsistencyArtifactContent>> {
  return executor(repository)
    .executeBuilder<NarrativeConsistencyBuilderInput, NarrativeConsistencyArtifactContent>({
      builderType: NARRATIVE_CONSISTENCY_BUILDER_TYPE,
      companyId: builderInput.company_id,
      periodId: builderInput.period_id,
      executionId: `narrative-consistency-${builderInput.period_id}`,
      input: builderInput,
      inputHash: `narrative-consistency-input-${builderInput.period_id}`,
      dependencies,
    });
}

function executor(repository: ArtifactRepository): BuilderExecutor {
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: NARRATIVE_CONSISTENCY_BUILDER_TYPE,
    artifact_type: "narrative_consistency",
    version: NARRATIVE_CONSISTENCY_BUILDER_VERSION,
    schema_version: NARRATIVE_CONSISTENCY_SCHEMA_VERSION,
    pipeline_version: NARRATIVE_CONSISTENCY_PIPELINE_VERSION,
  }, () => new NarrativeConsistencyBuilder());

  return new BuilderExecutor(registry, new ArtifactService(repository));
}
