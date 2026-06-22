import {
  PipelineExecutionError,
  PlatformError,
  platformErrorMessage,
} from "./platform-error.js";

const BORDER = "═══════════════════════════════════════";

export function normalizePlatformError(error: unknown): PlatformError {
  if (error instanceof PlatformError) {
    return error;
  }

  return new PipelineExecutionError(platformErrorMessage(error), {
    cause: error,
    suggestedAction:
      "Run again with --debug, inspect the underlying cause, and correct the failing pipeline configuration or runtime dependency.",
  });
}

export function renderPlatformError(
  error: PlatformError,
  options: { debug?: boolean } = {},
): string {
  const lines = [
    BORDER,
    "PIPELINE EXECUTION FAILED",
    BORDER,
    "",
    `Builder: ${error.context.builder_type ?? "not_available"}`,
    "",
    `Artifact: ${error.context.artifact_type ?? "not_available"}`,
    "",
    "Execution:",
    error.context.execution_id ?? "not_available",
    "",
    `Error Type: ${error.name}`,
    "",
    `Error: ${error.message}`,
  ];

  if (error.suggestedAction) {
    lines.push("", `Suggested Action: ${error.suggestedAction}`);
  }

  if (options.debug) {
    lines.push("", "Debug Details:", renderCauseChain(error));
  }

  lines.push("", BORDER);

  return lines.join("\n");
}

function renderCauseChain(error: unknown): string {
  const sections: string[] = [];
  const visited = new Set<unknown>();
  let current: unknown = error;
  let depth = 0;

  while (current !== undefined && current !== null && !visited.has(current)) {
    visited.add(current);
    const label = depth === 0 ? "Error" : `Cause ${depth}`;

    if (current instanceof Error) {
      sections.push(
        `${label}: ${current.name}: ${current.message}\n${current.stack ?? "(stack unavailable)"}`,
      );
      current = current.cause;
    } else {
      sections.push(`${label}: ${String(current)}`);
      current = undefined;
    }

    depth += 1;
  }

  return sections.join("\n\n");
}
