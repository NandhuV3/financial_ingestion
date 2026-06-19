import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import type { BusinessSignal, BusinessSignalsArtifactContent } from "../types.js";
import { validateBusinessSignalsArtifactContent } from "../validator.js";
import { validBusinessSignalsContent } from "./business-signals-builder.fixtures.js";

describe("business signals enrichment validation", () => {
  it("validates base coverage with only Company Knowledge available", () => {
    const content = validBusinessSignalsContent();

    validateBusinessSignalsArtifactContent(content);
  });

  it("validates standard coverage with Quarter Change only", () => {
    const content = validBusinessSignalsContent();
    content.enrichment_status.quarter_change = availableStatus("quarter-change-1");
    content.depth_indicator.overall = "standard";

    validateBusinessSignalsArtifactContent(content);
  });

  it("validates standard coverage with Topic Evolution only", () => {
    const content = validBusinessSignalsContent();
    content.enrichment_status.topic_evolution = availableStatus("topic-evolution-1");
    content.depth_indicator.overall = "standard";

    validateBusinessSignalsArtifactContent(content);
  });

  it("validates full coverage with Quarter Change and Topic Evolution", () => {
    const content = validBusinessSignalsContent();
    content.enrichment_status.quarter_change = availableStatus("quarter-change-1");
    content.enrichment_status.topic_evolution = availableStatus("topic-evolution-1");
    content.depth_indicator.overall = "full";

    validateBusinessSignalsArtifactContent(content);
  });

  it("rejects invalid enrichment status consistency", () => {
    const content = validBusinessSignalsContent();
    content.enrichment_status.quarter_change = {
      available: true,
      artifact_ref: null,
      artifact_version: 1,
      absent_reason: null,
    };

    assert.throws(
      () => validateBusinessSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects invalid depth indicator values", () => {
    const content = validBusinessSignalsContent();
    content.depth_indicator.overall = "deep" as BusinessSignalsArtifactContent["depth_indicator"]["overall"];

    assert.throws(
      () => validateBusinessSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects movement signals when Quarter Change enrichment is unavailable", () => {
    const content = validBusinessSignalsContent();
    content.signals[0] = {
      ...content.signals[0] as BusinessSignal,
      rule_ref: "business_signals.movement.quarter_change_observed",
      source_artifact_refs: [
        ...(content.signals[0]?.source_artifact_refs ?? []),
        {
          artifact_id: "quarter-change-1",
          artifact_type: "quarter_change",
          artifact_version: 1,
        },
      ],
    };

    assert.throws(
      () => validateBusinessSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects trend signals when Topic Evolution enrichment is unavailable", () => {
    const content = validBusinessSignalsContent();
    content.signals[0] = {
      ...content.signals[0] as BusinessSignal,
      rule_ref: "business_signals.trend.topic_evolution_observed",
      source_artifact_refs: [
        ...(content.signals[0]?.source_artifact_refs ?? []),
        {
          artifact_id: "topic-evolution-1",
          artifact_type: "topic_evolution",
          artifact_version: 1,
        },
      ],
    };

    assert.throws(
      () => validateBusinessSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects invalid coverage classification", () => {
    const content = validBusinessSignalsContent();
    content.enrichment_status.quarter_change = availableStatus("quarter-change-1");
    content.depth_indicator.overall = "base";

    assert.throws(
      () => validateBusinessSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });
});

function availableStatus(artifactId: string): BusinessSignalsArtifactContent["enrichment_status"]["quarter_change"] {
  return {
    available: true,
    artifact_ref: artifactId,
    artifact_version: 1,
    absent_reason: null,
  };
}
