import type { TopicEvolution, TopicEvolutionReport } from "./topic-evolution.types.js";

export function buildTopicEvolutionMarkdown(report: TopicEvolutionReport): string {
  const lines = [
    `# ${report.company || report.ticker} Topic Evolution Report`,
    "",
    `Ticker: ${report.ticker}`,
    `History: ${report.history_start ?? "n/a"} to ${report.history_end ?? "n/a"}`,
    `Filings analyzed: ${report.filings_analyzed}`,
    `Topic registry version: ${report.topic_registry_version}`,
    "",
    "## Summary",
    "",
    `- Topics analyzed: ${report.summary.topics_analyzed}`,
    `- Topics present latest: ${report.summary.topics_present_latest}`,
    `- New topics: ${report.summary.new_topics}`,
    `- Persistent topics: ${report.summary.persistent_topics}`,
    `- Recurring topics: ${report.summary.recurring_topics}`,
    `- Dormant topics: ${report.summary.dormant_topics}`,
    `- Disappeared topics: ${report.summary.disappeared_topics}`,
    `- Strengthening topics: ${report.summary.strengthening_topics}`,
    `- Weakening topics: ${report.summary.weakening_topics}`,
    `- Stable topics: ${report.summary.stable_topics}`,
    `- Mixed topics: ${report.summary.mixed_topics}`,
    `- Unknown trend topics: ${report.summary.unknown_trend_topics}`,
    "",
    "## Filings Analyzed",
    "",
    ...report.filing_dates.map((filingDate) => `- ${filingDate}`),
    "",
    ...topicSection("New Topics", report.topics.filter((topic) => topic.presence_state === "new")),
    ...topicSection("Persistent Topics", report.topics.filter((topic) => topic.presence_state === "persistent")),
    ...topicSection("Strengthening Topics", report.topics.filter((topic) => topic.trend_state === "strengthening")),
    ...topicSection("Weakening Topics", report.topics.filter((topic) => topic.trend_state === "weakening")),
    ...topicSection(
      "Dormant and Disappeared Topics",
      report.topics.filter((topic) => topic.presence_state === "dormant" || topic.presence_state === "disappeared"),
    ),
    "## Diagnostics",
    "",
    `- Assigned topics used: ${report.diagnostics.assigned_topics_used}`,
    `- Unassigned topics ignored: ${report.diagnostics.unassigned_topics_ignored}`,
    `- Themes without topic ignored: ${report.diagnostics.themes_without_topic_ignored}`,
    `- Missing themes.with-topics files: ${report.diagnostics.missing_themes_with_topics_files.length}`,
    `- Filings with no assigned topics: ${report.diagnostics.filings_with_no_assigned_topics.length}`,
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function topicSection(title: string, topics: TopicEvolution[]): string[] {
  const lines = [`## ${title}`, ""];

  if (topics.length === 0) {
    lines.push("None.", "");
    return lines;
  }

  for (const topic of topics) {
    lines.push(...topicTimeline(topic));
  }

  return lines;
}

function topicTimeline(topic: TopicEvolution): string[] {
  return [
    `### ${topic.topic_name}`,
    "",
    `Topic ID: ${topic.topic_id}`,
    `Presence: ${topic.presence_state}`,
    `Trend: ${topic.trend_state}`,
    `Current status: ${topic.current_status}`,
    `First seen: ${topic.first_seen ?? "n/a"}`,
    `Last seen: ${topic.last_seen ?? "n/a"}`,
    `Strength history: ${topic.strength_history.join(", ") || "n/a"}`,
    "",
    "| Filing | Present | Importance | Evidence | Themes | Strength |",
    "|---|---:|---|---:|---:|---:|",
    ...topic.history.map((observation) =>
      [
        observation.filing_date,
        observation.present ? "yes" : "no",
        observation.importance ?? "n/a",
        String(observation.evidence_count),
        String(observation.theme_count),
        String(observation.topic_strength),
      ].join(" | "),
    ).map((row) => `| ${row} |`),
    "",
  ];
}
