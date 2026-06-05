import type { TopicRegistry } from "../topic-layer/topic.types.js";
import type {
  TopicEvolutionDiagnostics,
  TopicEvolutionFilingInput,
  TopicEvolutionReport,
  TopicEvolutionSummary,
} from "./topic-evolution.types.js";
import { buildTopicHistories } from "./build-topic-history.js";
import { validateTopicEvolutionInputs } from "./validate-topic-evolution.js";

type BuildTopicEvolutionReportInput = {
  filings: TopicEvolutionFilingInput[];
  registry: TopicRegistry;
  topicRegistryHash: string;
  generatedAt: string;
  durationMs: number;
};

export function buildTopicEvolutionReport(input: BuildTopicEvolutionReportInput): TopicEvolutionReport {
  validateTopicEvolutionInputs(input.filings, input.registry);

  const sortedFilings = [...input.filings].sort((a, b) => a.metadata.filing_date.localeCompare(b.metadata.filing_date));
  const company = sortedFilings[0]?.metadata.company ?? "";
  const ticker = sortedFilings[0]?.metadata.ticker ?? "";
  const historyResult = buildTopicHistories(sortedFilings, input.registry.topics);
  const diagnostics: TopicEvolutionDiagnostics = {
    ...historyResult.diagnostics,
    duration_ms: input.durationMs,
  };

  return {
    company,
    ticker,
    generated_at: input.generatedAt,
    history_start: sortedFilings[0]?.metadata.filing_date ?? null,
    history_end: sortedFilings.at(-1)?.metadata.filing_date ?? null,
    filings_analyzed: sortedFilings.length,
    filing_dates: sortedFilings.map((filing) => filing.metadata.filing_date),
    topic_registry_version: input.registry.version ?? "unversioned",
    topic_registry_hash: input.topicRegistryHash,
    assignment_policy: {
      included_statuses: ["approved"],
      excluded_statuses: ["pending_review", "rejected", "missing"],
    },
    summary: summarizeTopicEvolution(historyResult.topics),
    topics: historyResult.topics,
    diagnostics,
  };
}

export function summarizeTopicEvolution(topics: TopicEvolutionReport["topics"]): TopicEvolutionSummary {
  return {
    topics_analyzed: topics.length,
    topics_present_latest: topics.filter((topic) => topic.current_status === "present").length,
    new_topics: topics.filter((topic) => topic.presence_state === "new").length,
    persistent_topics: topics.filter((topic) => topic.presence_state === "persistent").length,
    recurring_topics: topics.filter((topic) => topic.presence_state === "recurring").length,
    dormant_topics: topics.filter((topic) => topic.presence_state === "dormant").length,
    disappeared_topics: topics.filter((topic) => topic.presence_state === "disappeared").length,
    strengthening_topics: topics.filter((topic) => topic.trend_state === "strengthening").length,
    weakening_topics: topics.filter((topic) => topic.trend_state === "weakening").length,
    stable_topics: topics.filter((topic) => topic.trend_state === "stable").length,
    mixed_topics: topics.filter((topic) => topic.trend_state === "mixed").length,
    unknown_trend_topics: topics.filter((topic) => topic.trend_state === "unknown").length,
    insufficient_history_topics: topics.filter((topic) => topic.trend_state === "insufficient_history").length,
  };
}
