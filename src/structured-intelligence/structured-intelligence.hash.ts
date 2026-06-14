import { calculateStringHash } from "../shared/hashing/hash-file.js";
import type { StructuredIntelligencePromptInput } from "./types/build-structured-intelligence.prompt.types.js";

export function calculateStructuredIntelligenceInputHash(
  input: StructuredIntelligencePromptInput,
): string {
  return calculateStringHash(JSON.stringify(input));
}
