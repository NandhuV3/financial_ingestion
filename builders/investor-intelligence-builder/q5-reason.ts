import type { Q5Input, Q5PromptOutput } from "./types.js";
import {
  parsePromptJson,
  requiredEvidence,
  requiredString,
  requiredStringArray,
} from "./prompt-output.js";

export function buildQ5PromptInput(input: Q5Input): Q5Input {
  return {
    q1: input.q1,
    q2: input.q2,
    q3: input.q3,
    q4: input.q4,
  };
}

export function buildQ5UserPrompt(input: Q5Input): string {
  return JSON.stringify({ question_id: "q5", input }, null, 2);
}

export function parseQ5PromptOutput(outputText: string): Q5PromptOutput {
  const value = parsePromptJson(outputText, "Q5", [
    "status",
    "bull_case",
    "bear_case",
    "key_drivers",
    "key_risks",
    "evidence_package",
    "limitations",
  ]);

  return {
    status: requiredString(value.status, "q5.status") as Q5PromptOutput["status"],
    bull_case: requiredStringArray(value.bull_case, "q5.bull_case"),
    bear_case: requiredStringArray(value.bear_case, "q5.bear_case"),
    key_drivers: requiredStringArray(value.key_drivers, "q5.key_drivers"),
    key_risks: requiredStringArray(value.key_risks, "q5.key_risks"),
    evidence_package: requiredEvidence(value.evidence_package, "q5.evidence_package"),
    limitations: requiredStringArray(value.limitations, "q5.limitations"),
  };
}
