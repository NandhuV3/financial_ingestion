import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import type { Q1Business, Q2Money, Q3Trust, Q4PromptOutput } from "./types.js";
import {
  optionalString,
  parsePromptJson,
  requiredEvidence,
  requiredString,
  requiredStringArray,
} from "./prompt-output.js";

export type Q4PromptInput = {
  q1: Q1Business;
  q2: Q2Money;
  q3: Q3Trust;
  market_data: null;
};

export function buildQ4PromptInput(params: { q1: Q1Business; q2: Q2Money; q3: Q3Trust }): Q4PromptInput {
  return {
    q1: params.q1,
    q2: params.q2,
    q3: params.q3,
    market_data: null,
  };
}

export function buildQ4UserPrompt(input: Q4PromptInput): string {
  return JSON.stringify({ question_id: "q4", input }, null, 2);
}

export function parseQ4PromptOutput(outputText: string): Q4PromptOutput {
  const value = parsePromptJson(outputText, "Q4", [
    "status",
    "summary",
    "expectation_context",
    "valuation_depth_limitation",
    "absent_reason",
    "evidence_package",
    "limitations",
  ]);
  const status = requiredString(value.status, "q4.status");
  const absentReason = requiredString(value.absent_reason, "q4.absent_reason");

  if (status !== "insufficient_data") {
    throw new BuilderValidationError("Q4 prompt output must be insufficient_data in Sprint 11.");
  }

  if (absentReason !== "market_data_unavailable") {
    throw new BuilderValidationError("Q4 prompt output must record market_data_unavailable.");
  }

  return {
    status,
    summary: requiredString(value.summary, "q4.summary"),
    expectation_context: requiredString(value.expectation_context, "q4.expectation_context"),
    valuation_depth_limitation: optionalString(value.valuation_depth_limitation, "q4.valuation_depth_limitation"),
    absent_reason: "market_data_unavailable",
    evidence_package: requiredEvidence(value.evidence_package, "q4.evidence_package"),
    limitations: requiredStringArray(value.limitations, "q4.limitations"),
  };
}
