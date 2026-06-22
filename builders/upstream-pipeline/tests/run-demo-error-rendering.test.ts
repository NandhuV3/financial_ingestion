import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../../packages/builder-framework/src/builder-errors.js";
import {
  PipelineExecutionError,
  PlatformError,
} from "../../../packages/builder-framework/src/platform-error.js";
import {
  normalizePlatformError,
  renderPlatformError,
} from "../../../packages/builder-framework/src/platform-error-renderer.js";
import { parseArguments, runDemoCli } from "../run-demo.js";

describe("pipeline error rendering", () => {
  it("renders BuilderValidationError without stack traces by default", () => {
    const error = new BuilderValidationError("theme category is invalid", {
      context: executionContext(),
      suggestedAction: "Use a canonical Theme category.",
    });
    const rendered = renderPlatformError(error);

    assert.match(rendered, /PIPELINE EXECUTION FAILED/);
    assert.match(rendered, /Builder: themes/);
    assert.match(rendered, /Artifact: themes/);
    assert.match(rendered, /Execution:\nMSFT:2026-Q2:themes/);
    assert.match(rendered, /Error Type: BuilderValidationError/);
    assert.match(rendered, /Error: theme category is invalid/);
    assert.match(
      rendered,
      /Suggested Action: Use a canonical Theme category\./,
    );
    assert.doesNotMatch(rendered, /Debug Details:/);
    assert.doesNotMatch(rendered, /\n\s+at /);
  });

  it("renders BuilderDependencyError with standardized fields", () => {
    const error = new BuilderDependencyError("Themes artifact is missing", {
      context: executionContext(),
      suggestedAction: "Generate Themes before retrying.",
    });
    const rendered = renderPlatformError(error);

    assert.match(rendered, /Error Type: BuilderDependencyError/);
    assert.match(rendered, /Error: Themes artifact is missing/);
    assert.match(
      rendered,
      /Suggested Action: Generate Themes before retrying\./,
    );
  });

  it("normalizes unknown errors to PipelineExecutionError", () => {
    const source = new Error("socket unavailable");
    const normalized = normalizePlatformError(source);

    assert.ok(normalized instanceof PipelineExecutionError);
    assert.equal(normalized.code, "PIPELINE_EXECUTION_ERROR");
    assert.equal(normalized.message, "socket unavailable");
    assert.equal(normalized.cause, source);
  });

  it("renders full stack traces and nested causes in debug mode", () => {
    const root = new Error("provider timeout");
    const nested = new BuilderDependencyError("model dependency unavailable", {
      cause: root,
    });
    const error = new BuilderValidationError("prompt output failed validation", {
      cause: nested,
      context: executionContext(),
    });
    const rendered = renderPlatformError(error, { debug: true });

    assert.match(rendered, /Debug Details:/);
    assert.match(rendered, /BuilderValidationError: prompt output failed validation/);
    assert.match(rendered, /Cause 1: BuilderDependencyError: model dependency unavailable/);
    assert.match(rendered, /Cause 2: Error: provider timeout/);
    assert.match(rendered, /\n\s+at /);
  });

  it("preserves PlatformError instances during normalization", () => {
    const error = new PipelineExecutionError("pipeline failed");

    assert.equal(normalizePlatformError(error), error);
    assert.ok(error instanceof PlatformError);
  });

  it("parses the optional debug flag without consuming its neighbors", () => {
    const parsed = parseArguments([
      "--debug",
      "--input",
      "filing.json",
      "--output",
      "output/test",
    ]);

    assert.equal(parsed.debug, true);
    assert.equal(parsed.outputDirectory, "output/test");
    assert.equal(parsed.inputPath.endsWith("filing.json"), true);
  });

  it("renders CLI failures without stacks by default and with stacks in debug mode", async () => {
    const normal = await captureConsoleError(() => runDemoCli([]));
    const debug = await captureConsoleError(() => runDemoCli(["--debug"]));

    assert.equal(normal.exitCode, 1);
    assert.match(normal.output, /Error Type: ConfigurationError/);
    assert.doesNotMatch(normal.output, /Debug Details:/);
    assert.equal(debug.exitCode, 1);
    assert.match(debug.output, /Debug Details:/);
    assert.match(debug.output, /ConfigurationError/);
    assert.match(debug.output, /\n\s+at /);
  });
});

function executionContext() {
  return {
    builder_type: "themes",
    artifact_type: "themes",
    execution_id: "MSFT:2026-Q2:themes",
    company_id: "MSFT",
    period_id: "2026-Q2",
  };
}

async function captureConsoleError(
  operation: () => Promise<number>,
): Promise<{ exitCode: number; output: string }> {
  const original = console.error;
  const output: string[] = [];

  console.error = (...values: unknown[]) => {
    output.push(values.map(String).join(" "));
  };

  try {
    return {
      exitCode: await operation(),
      output: output.join("\n"),
    };
  } finally {
    console.error = original;
  }
}
