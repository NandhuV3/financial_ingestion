import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PromptActivationGate } from "./activation-gate.js";
import { defaultPromptCacheRoot } from "./cache-prompt-provider.js";
import type { PromptActivation } from "./prompt-activation.types.js";

export interface PromptActivationStore {
  getActivation(promptId: string): PromptActivation | null;
}

export class FilePromptActivationStore implements PromptActivationStore {
  private readonly activationGate: PromptActivationGate;

  constructor(
    private readonly cacheRoot = defaultPromptCacheRoot(),
    activationGate?: PromptActivationGate,
  ) {
    this.activationGate = activationGate ?? PromptActivationGate.fromCacheRoot(cacheRoot);
  }

  getActivation(promptId: string): PromptActivation | null {
    const activations = this.readActivations()
      .filter((activation) => activation.prompt_id === promptId)
      .sort(compareActivationsNewestFirst);

    return activations[0] ?? null;
  }

  async saveActivation(activation: PromptActivation): Promise<void> {
    validateActivation(activation);
    this.activationGate.validateActivation(activation);

    const activations = [
      ...this.readActivations(),
      activation,
    ];

    await mkdir(this.cacheRoot, { recursive: true });
    await writeFile(
      this.activationsPath(),
      `${JSON.stringify(activations, null, 2)}\n`,
      "utf8",
    );
  }

  private readActivations(): PromptActivation[] {
    try {
      const parsed = JSON.parse(readFileSync(this.activationsPath(), "utf8")) as unknown;

      if (!Array.isArray(parsed)) {
        console.warn("Prompt activations cache is corrupt: expected an array.");
        return [];
      }

      return parsed.filter(isPromptActivation);
    } catch (error) {
      if (isMissingFileError(error)) {
        return [];
      }

      console.warn(`Prompt activations cache unavailable or corrupt: ${errorMessage(error)}`);
      return [];
    }
  }

  private activationsPath(): string {
    return join(this.cacheRoot, "activations.json");
  }
}

function validateActivation(activation: PromptActivation): void {
  for (const [field, value] of Object.entries(activation)) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Prompt activation field "${field}" is required.`);
    }
  }
}

function isPromptActivation(value: unknown): value is PromptActivation {
  return typeof value === "object"
    && value !== null
    && typeof (value as PromptActivation).activation_id === "string"
    && typeof (value as PromptActivation).prompt_id === "string"
    && typeof (value as PromptActivation).active_version === "string"
    && typeof (value as PromptActivation).activated_at === "string"
    && typeof (value as PromptActivation).activated_by === "string"
    && typeof (value as PromptActivation).reason === "string";
}

function compareActivationsNewestFirst(left: PromptActivation, right: PromptActivation): number {
  return right.activated_at.localeCompare(left.activated_at)
    || right.activation_id.localeCompare(left.activation_id);
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
