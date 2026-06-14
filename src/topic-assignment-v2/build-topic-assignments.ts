import { join } from "node:path";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { createLogger } from "../shared/logger.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import type { SemanticTopicMatch, SemanticTopicMatchFile } from "../topic-intelligence/semantic-topic.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type {
  TopicAssignedThemeV2,
  TopicAssignmentOutputV2,
  TopicAssignmentSummary,
  TopicRecommendationMethod,
} from "./assignment.types.js";
import { AUTO_ASSIGN_THRESHOLD, LOW_CONFIDENCE_THRESHOLD } from "./topic-assignment.constants.js";

const logger = createLogger("topic-assignment-v2");

export async function buildTopicAssignments(ticker: string, filingDate: string): Promise<TopicAssignmentOutputV2> {
  const startedAt = Date.now();
  const normalizedTicker = ticker.trim().toUpperCase();
  const filingDir = getFilingDirectory(normalizedTicker, filingDate);
  const themesPath = join(filingDir, "intelligence", "themes.json");

  if (!fileExists(themesPath)) {
    throw new Error(`Missing themes.json at ${themesPath}. Run theme generation before topic assignment.`);
  }

  const themes = await readJsonFile<ThemeOutput>(themesPath);
  const matches = await readSemanticMatches(filingDir);
  const output = assignTopicsByConfidence({
    themes,
    matches,
  });
  const summary = summarizeAssignments(output.themes);

  await writeJsonFile(join(filingDir, "intelligence", "themes.with-topics.json"), output);

  logger.info("Topic assignments built.", {
    ticker: normalizedTicker,
    filing_date: filingDate,
    duration_ms: Date.now() - startedAt,
    semantic_matches_loaded: matches.length,
    assigned_count: summary.assigned_count,
    low_confidence_count: summary.low_confidence_count,
    unassigned_count: summary.unassigned_count,
  });

  return output;
}

export function assignTopicsByConfidence(params: {
  themes: ThemeOutput;
  matches: SemanticTopicMatch[];
}): TopicAssignmentOutputV2 {
  const matchMap = new Map(params.matches.map((match) => [normalizeTheme(match.theme), match]));

  return {
    company: params.themes.company,
    ticker: params.themes.ticker,
    filing_date: params.themes.filing_date,
    themes: params.themes.themes.map((theme) => {
      const match = matchMap.get(normalizeTheme(theme.theme));
      const recommendationMethod = match ? deriveRecommendationMethod(match) : null;
      const recommendationReason = match?.match_reason ?? null;
      const confidence = match?.confidence ?? null;

      if (!match || confidence === null || confidence < LOW_CONFIDENCE_THRESHOLD) {
        return {
          ...theme,
          topic_id: null,
          confidence,
          assignment_method: null,
          recommendation_method: recommendationMethod,
          recommendation_reason: recommendationReason,
          assignment_status: "unassigned",
        };
      }

      if (confidence >= AUTO_ASSIGN_THRESHOLD) {
        return {
          ...theme,
          topic_id: match.selected_topic,
          confidence,
          assignment_method: "automatic",
          recommendation_method: recommendationMethod,
          recommendation_reason: recommendationReason,
          assignment_status: "assigned",
        };
      }

      return {
        ...theme,
        topic_id: match.selected_topic,
        confidence,
        assignment_method: "automatic",
        recommendation_method: recommendationMethod,
        recommendation_reason: recommendationReason,
        assignment_status: "low_confidence",
      };
    }),
  };
}

export function summarizeAssignments(themes: TopicAssignedThemeV2[]): TopicAssignmentSummary {
  return {
    assigned_count: themes.filter((theme) => theme.assignment_status === "assigned").length,
    low_confidence_count: themes.filter((theme) => theme.assignment_status === "low_confidence").length,
    unassigned_count: themes.filter((theme) => theme.assignment_status === "unassigned").length,
  };
}

async function readSemanticMatches(filingDir: string): Promise<SemanticTopicMatch[]> {
  const matchPath = join(filingDir, "intelligence", "semantic-topic-matches.json");

  if (!fileExists(matchPath)) {
    throw new Error([
      `Missing semantic-topic-matches.json at ${matchPath}.`,
      "Topic matching has not been executed for this filing.",
      "Run: npm run generate:topic-matches -- <ticker> <filing-date>",
    ].join(" "));
  }

  const matchFile = await readJsonFile<SemanticTopicMatchFile>(matchPath);
  const matches = matchFile.matches ?? [];

  logger.info("Semantic topic matches loaded.", {
    match_path: matchPath,
    semantic_matches_loaded: matches.length,
  });

  return matches;
}

function deriveRecommendationMethod(_match: SemanticTopicMatch): TopicRecommendationMethod {
  return "semantic";
}

function normalizeTheme(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
