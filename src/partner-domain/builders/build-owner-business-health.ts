import type {
  BusinessHealthArea,
  BusinessHealth,
  BusinessHealthDashboard,
  BusinessHealthTimelinePoint,
  OwnerBusinessHealth,
} from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";

export function buildBusinessHealthDashboard(
  artifacts: PartnerSourceArtifacts,
  businessHealth: BusinessHealth,
): BusinessHealthDashboard {
  const status = toOwnerHealth(businessHealth);
  const timeline = buildHealthTimeline(artifacts, status);
  const strengtheningAreas = buildStrengtheningAreas(artifacts).slice(0, 3);
  const watchAreas = buildWatchAreas(artifacts).slice(0, 3);

  return {
    status,
    explanation: buildHealthExplanation(strengtheningAreas, watchAreas, status),
    strengtheningAreas: strengtheningAreas.map((title) => fallbackArea(title, "This area is receiving stronger attention in the latest business signals.")),
    watchAreas: watchAreas.map((title) => fallbackArea(title, "This area deserves closer owner attention based on the latest business signals.")),
    timeline,
  };
}

function buildStrengtheningAreas(artifacts: PartnerSourceArtifacts): string[] {
  const fromTopicChanges = artifacts.quarterChange?.topic_changes
    .filter((change) => change.change_type === "TOPIC_INTENSIFIED")
    .map((change) => topicLabel(change.topic_id)) ?? [];
  const fromCategoryChanges = artifacts.quarterChange?.changes
    .filter((change) => ["NEW_CATEGORY", "EVIDENCE_INCREASED", "IMPORTANCE_INCREASED"].includes(change.change_type))
    .flatMap((change) => [
      ...change.current_theme_names.map(themeLabel),
      categoryLabel(change.category),
    ]) ?? [];
  const fromEvolution = artifacts.topicEvolution?.topics
    .filter((topic) => topic.current_status === "present" && topic.trend_state === "strengthening")
    .map((topic) => topic.topic_name) ?? [];

  return dedupe([...fromTopicChanges, ...fromCategoryChanges, ...fromEvolution])
    .filter((label) => !isWeakLabel(label));
}

function buildWatchAreas(artifacts: PartnerSourceArtifacts): string[] {
  const fromTopicChanges = artifacts.quarterChange?.topic_changes
    .filter((change) => change.change_type === "TOPIC_WEAKENED")
    .map((change) => topicLabel(change.topic_id)) ?? [];
  const fromCategoryChanges = artifacts.quarterChange?.changes
    .filter((change) => ["REMOVED_CATEGORY", "EVIDENCE_DECREASED", "IMPORTANCE_DECREASED"].includes(change.change_type))
    .flatMap((change) => [
      ...change.current_theme_names.map(themeLabel),
      ...change.previous_theme_names.map(themeLabel),
      categoryLabel(change.category),
    ]) ?? [];
  const fromEvolution = artifacts.topicEvolution?.topics
    .filter((topic) =>
      topic.trend_state === "weakening"
      || topic.presence_state === "disappeared"
      || topic.current_status === "absent")
    .map((topic) => topic.topic_name) ?? [];
  const fromForensics = artifacts.companyKnowledge.risks.map(riskLabel) ?? [];

  return dedupe([...fromTopicChanges, ...fromCategoryChanges, ...fromEvolution, ...fromForensics])
    .filter((label) => !isWeakLabel(label));
}

function buildHealthExplanation(
  strengtheningAreas: string[],
  watchAreas: string[],
  status: OwnerBusinessHealth,
): string {
  if (strengtheningAreas.length === 0 && watchAreas.length === 0) {
    return "Business health is based on the available company intelligence, but there is not enough directional detail yet.";
  }

  const strengtheningText = strengtheningAreas.length > 0
    ? `${sentenceList(strengtheningAreas)} strengthened`
    : "";
  const watchText = watchAreas.length > 0
    ? `${sentenceList(watchAreas)} should be watched closely`
    : "";

  if (strengtheningText && watchText) {
    return `${strengtheningText}, while ${watchText}.`;
  }

  if (strengtheningText) {
    return `${strengtheningText}, supporting an ${status === "improving" ? "improving" : "steady"} business direction.`;
  }

  return `${watchText}, which is why this business needs closer attention.`;
}

function fallbackArea(title: string, explanation: string): BusinessHealthArea {
  return {
    title,
    explanation,
  };
}

function buildHealthTimeline(
  artifacts: PartnerSourceArtifacts,
  currentStatus: OwnerBusinessHealth,
): BusinessHealthTimelinePoint[] {
  const dates = artifacts.topicEvolution?.filing_dates ?? [artifacts.filing.filing_date];
  const latestDates = dates.slice(-3).reverse();

  return latestDates.map((filingDate, index) => ({
    label: index === 0 ? "Current Filing" : index === 1 ? "Previous Filing" : "Older Filing",
    filingDate,
    status: index === 0 ? currentStatus : inferHistoricalStatus(artifacts, filingDate),
  }));
}

function inferHistoricalStatus(
  artifacts: PartnerSourceArtifacts,
  filingDate: string,
): OwnerBusinessHealth {
  const topicObservations = artifacts.topicEvolution?.topics.flatMap((topic) =>
    topic.history.filter((observation) => observation.filing_date === filingDate),
  ) ?? [];

  if (topicObservations.length === 0) {
    return "stable";
  }

  const present = topicObservations.filter((observation) => observation.present);
  const highImportance = present.filter((observation) => observation.importance === "high").length;
  const absent = topicObservations.length - present.length;

  if (absent > present.length) {
    return "needs_attention";
  }

  if (highImportance >= 2) {
    return "improving";
  }

  return "stable";
}

function toOwnerHealth(value: BusinessHealth): OwnerBusinessHealth {
  return value === "weakening" ? "needs_attention" : value;
}

function themeLabel(value: string): string {
  return cleanLabel(value)
    .replace(/\bRevenue Growth\b/gi, "Growth")
    .replace(/\bMarket Landscape\b/gi, "")
    .replace(/\bFactors\b/gi, "")
    .trim();
}

function categoryLabel(value: string): string {
  return cleanLabel(value.replace(/_/g, " "));
}

function topicLabel(value: string): string {
  return categoryLabel(value);
}

function riskLabel(value: string): string {
  return cleanLabel(value)
    .replace(/\breceived more attention as a business risk\b/gi, "")
    .replace(/\bremains an important business risk\b/gi, "")
    .replace(/\bis newly highlighted as a business consideration\b/gi, "")
    .trim();
}

function cleanLabel(value: string): string {
  const cleaned = value
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .trim();

  return cleaned
    .split(" ")
    .map((word) => word.length <= 3 && word === word.toUpperCase()
      ? word
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function isWeakLabel(value: string): boolean {
  return value.length < 3
    || ["Growth", "Investments", "Macroeconomic", "Regulation"].includes(value);
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const cleaned = value.replace(/\s+/g, " ").trim();
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(cleaned);
  }

  return output;
}

function sentenceList(values: string[]): string {
  if (values.length === 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}
