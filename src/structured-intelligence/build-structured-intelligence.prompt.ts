import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { PartnerTopicEvolutionSource } from "../partner-domain/partner-source.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { OpenAIResponse } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type { TopicAssignmentOutputV2 } from "../topic-assignment-v2/assignment.types.js";
import { STRUCTURED_INTELLIGENCE_MODEL_VERSION } from "./structured-intelligence.constants.js";
import type {
  StructuredIntelligenceLLMOutput,
  StructuredIntelligencePromptInput,
} from "./types/build-structured-intelligence.prompt.types.js";

export type StructuredIntelligencePromptSourceArtifacts = {
  filingMetadata: FilingMetadata;
  themes: ThemeOutput | null;
  topicAssignments: TopicAssignmentOutputV2 | null;
  quarterChanges: QuarterChangeReport | null;
  topicEvolution: PartnerTopicEvolutionSource | null;
};

type StructuredIntelligenceGenerationParams = {
  prompt: string;
  systemPrompt?: string;
  model?: string;
};

export const STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT = [
  "You generate durable structured business intelligence from filing-derived artifacts.",
  "Use only the provided evidence.",
  "Do not invent products, customers, risks, opportunities, dependencies, or business model details.",
  "Return only valid JSON matching the requested output keys.",
].join(" ");

export function buildStructuredIntelligencePrompt(
  input: StructuredIntelligencePromptInput,
): string {
  return [
    "Build Structured Intelligence V1 from the following filing-derived inputs.",
    "",
    "Return JSON with exactly these keys:",
    "business_description, products, customers, revenue_drivers, competitive_positioning, operating_model, key_dependencies, strategic_priorities, risks, opportunities.",
    "",
    "Output schema:",
    JSON.stringify({
      business_description: "string",
      products: ["string"],
      customers: ["string"],
      revenue_drivers: ["string"],
      competitive_positioning: ["string"],
      operating_model: ["string"],
      key_dependencies: ["string"],
      strategic_priorities: ["string"],
      risks: ["string"],
      opportunities: ["string"],
    }, null, 2),
    "",
    "Rules:",
    "- business_description must be one plain-language sentence about what the company provides and who it serves.",
    "- products must be actual products, services, platforms, or offerings supported by the inputs.",
    "- customers must be payer or user groups supported by the inputs.",
    "- revenue_drivers must describe how money is generated, supported by the inputs.",
    "- competitive_positioning must describe supported positioning signals, not unsupported moat claims.",
    "- operating_model must describe supported operating signals.",
    "- key_dependencies must list business dependencies supported by the inputs.",
    "- strategic_priorities, risks, and opportunities must be grounded in the inputs.",
    "- Do not use theme names as products unless the theme names a real product, service, or platform.",
    "- Use empty strings or empty arrays when evidence is insufficient.",
    "",
    "Input:",
    JSON.stringify(input, null, 2),
  ].join("\n");
}

export async function generateStructuredIntelligence(
  params: StructuredIntelligenceGenerationParams,
): Promise<StructuredIntelligenceLLMOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate Structured Intelligence.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model ?? STRUCTURED_INTELLIGENCE_MODEL_VERSION,
      input: [
        {
          role: "system",
          content: params.systemPrompt ?? STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: params.prompt,
        },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return JSON.parse(extractOutputText((await response.json()) as OpenAIResponse)) as StructuredIntelligenceLLMOutput;
}

export function buildStructuredIntelligencePromptInput(
  artifacts: StructuredIntelligencePromptSourceArtifacts,
): StructuredIntelligencePromptInput {
  return {
    company: artifacts.filingMetadata.company,
    filing_date: artifacts.filingMetadata.filing_date,
    themes: (artifacts.themes?.themes ?? []).map((theme) => ({
      theme: theme.theme,
      category: theme.category,
      importance: theme.importance,
      summary: theme.summary,
    })),
    topics: (artifacts.topicAssignments?.themes ?? []).map((theme) => ({
      topic_id: theme.topic_id,
      theme: theme.theme,
      category: theme.category,
      summary: theme.summary,
      importance: theme.importance,
      assignment_status: theme.assignment_status,
      confidence: theme.confidence,
    })),
    topic_evolution: {
      strengthening_topics: topicNamesByTrend(artifacts.topicEvolution, "strengthening"),
      weakening_topics: topicNamesByTrend(artifacts.topicEvolution, "weakening"),
      stable_topics: topicNamesByTrend(artifacts.topicEvolution, "stable"),
      mixed_topics: topicNamesByTrend(artifacts.topicEvolution, "mixed"),
      topics: (artifacts.topicEvolution?.topics ?? []).map((topic) => ({
        topic_id: topic.topic_id,
        topic_name: topic.topic_name,
        trend_state: topic.trend_state,
        presence_state: topic.presence_state,
        quarters_present: topic.quarters_present,
        presence_ratio: topic.presence_ratio,
      })),
    },
    quarter_changes: {
      new_categories: artifacts.quarterChanges?.summary.new_categories ?? 0,
      removed_categories: artifacts.quarterChanges?.summary.removed_categories ?? 0,
      importance_increases: artifacts.quarterChanges?.summary.importance_increases ?? 0,
      importance_decreases: artifacts.quarterChanges?.summary.importance_decreases ?? 0,
      evidence_increases: artifacts.quarterChanges?.summary.evidence_increases ?? 0,
      evidence_decreases: artifacts.quarterChanges?.summary.evidence_decreases ?? 0,
      changes: (artifacts.quarterChanges?.changes ?? []).map((change) => ({
        change_type: change.change_type,
        category: change.category,
        previous_importance: change.previous_importance,
        current_importance: change.current_importance,
        previous_evidence_count: change.previous_evidence_count,
        current_evidence_count: change.current_evidence_count,
        previous_theme_names: change.previous_theme_names,
        current_theme_names: change.current_theme_names,
      })),
      topic_changes: (artifacts.quarterChanges?.topic_changes ?? []).map((change) => ({
        change_type: change.change_type,
        topic_id: change.topic_id,
        previous_categories: change.previous_categories,
        current_categories: change.current_categories,
        previous_theme_names: change.previous_theme_names,
        current_theme_names: change.current_theme_names,
        previous_importance: change.previous_importance,
        current_importance: change.current_importance,
        previous_evidence_count: change.previous_evidence_count,
        current_evidence_count: change.current_evidence_count,
      })),
    },
  };
}

function topicNamesByTrend(
  topicEvolution: PartnerTopicEvolutionSource | null,
  trendState: string,
): string[] {
  return unique((topicEvolution?.topics ?? [])
    .filter((topic) => topic.trend_state === trendState)
    .map((topic) => topic.topic_name));
}

function extractOutputText(response: OpenAIResponse): string {
  if (response.output_text) {
    return response.output_text;
  }

  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text" && typeof content.text === "string")
    ?.text;

  if (!text) {
    throw new Error("OpenAI response did not include output text.");
  }

  return text;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const cleaned = value.trim();
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(cleaned);
  }

  return output;
}
