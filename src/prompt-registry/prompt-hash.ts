import { createHash } from "node:crypto";

export function calculatePromptHash(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function calculateEffectivePromptHash(params: {
  systemPrompt: string;
  userPrompt: string;
  schemaVersion?: string;
}): string {
  return calculatePromptHash(JSON.stringify({
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    schemaVersion: params.schemaVersion ?? "",
  }));
}
