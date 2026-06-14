import { readdirSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defaultPromptCacheRoot } from "./cache-prompt-provider.js";
import type { PromptEvaluation } from "./prompt-evaluation.types.js";

export interface PromptEvaluationStore {
  getEvaluation(promptId: string, promptVersion: string): PromptEvaluation | null;
}

export class FilePromptEvaluationStore implements PromptEvaluationStore {
  constructor(private readonly cacheRoot = defaultPromptCacheRoot()) {}

  getEvaluation(promptId: string, promptVersion: string): PromptEvaluation | null {
    const evaluations = this.readEvaluations()
      .filter((evaluation) =>
        evaluation.prompt_id === promptId && evaluation.prompt_version === promptVersion)
      .sort(compareEvaluationsNewestFirst);

    return evaluations[0] ?? null;
  }

  async saveEvaluation(evaluation: PromptEvaluation): Promise<void> {
    validateEvaluation(evaluation);

    const directory = this.evaluationsDirectory();

    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, `${evaluation.evaluation_id}.json`),
      `${JSON.stringify(evaluation, null, 2)}\n`,
      "utf8",
    );
  }

  private readEvaluations(): PromptEvaluation[] {
    try {
      return readdirSyncJsonFiles(this.evaluationsDirectory())
        .map((path) => readEvaluationFile(path))
        .filter((evaluation): evaluation is PromptEvaluation => evaluation !== null);
    } catch (error) {
      if (isMissingFileError(error)) {
        return [];
      }

      console.warn(`Prompt evaluations cache unavailable or corrupt: ${errorMessage(error)}`);
      return [];
    }
  }

  private evaluationsDirectory(): string {
    return join(this.cacheRoot, "evaluations");
  }
}

function readdirSyncJsonFiles(directory: string): string[] {
  return readDirSync(directory)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => join(directory, fileName));
}

function readDirSync(directory: string): string[] {
  return readdirSync(directory);
}

function readEvaluationFile(path: string): PromptEvaluation | null {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;

    if (!isPromptEvaluation(parsed)) {
      console.warn(`Prompt evaluation cache entry is invalid: ${path}`);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(`Prompt evaluation cache entry is unreadable: ${path}: ${errorMessage(error)}`);
    return null;
  }
}

function validateEvaluation(evaluation: PromptEvaluation): void {
  if (!isPromptEvaluation(evaluation)) {
    throw new Error("Prompt evaluation is invalid.");
  }
}

function isPromptEvaluation(value: unknown): value is PromptEvaluation {
  return typeof value === "object"
    && value !== null
    && typeof (value as PromptEvaluation).evaluation_id === "string"
    && typeof (value as PromptEvaluation).prompt_id === "string"
    && typeof (value as PromptEvaluation).prompt_version === "string"
    && typeof (value as PromptEvaluation).overall_score === "number"
    && Number.isFinite((value as PromptEvaluation).overall_score)
    && typeof (value as PromptEvaluation).passed === "boolean"
    && Array.isArray((value as PromptEvaluation).warnings)
    && (value as PromptEvaluation).warnings.every((warning) => typeof warning === "string")
    && Array.isArray((value as PromptEvaluation).failures)
    && (value as PromptEvaluation).failures.every((failure) => typeof failure === "string")
    && (typeof (value as PromptEvaluation).compared_against === "undefined"
      || typeof (value as PromptEvaluation).compared_against === "string")
    && typeof (value as PromptEvaluation).created_at === "string";
}

function compareEvaluationsNewestFirst(left: PromptEvaluation, right: PromptEvaluation): number {
  return right.created_at.localeCompare(left.created_at)
    || right.evaluation_id.localeCompare(left.evaluation_id);
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
