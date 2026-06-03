import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { createLogger } from "../shared/logger.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { generateThemeEmbeddings } from "./generate-theme-embedding.js";
import {
  buildSemanticTopicMatchFile,
  matchThemesToTopics,
} from "./semantic-match-engine.js";
import type { TopicEmbeddingRegistry } from "./semantic-topic.types.js";
import { writeTopicAssignmentReviewQueue } from "./review-queue.js";

const logger = createLogger("semantic-topic-match");
const topicEmbeddingsPath = join(process.cwd(), "data", "registry", "topic-embeddings.json");

export async function matchTopicsForFiling(ticker: string, filingDate: string) {
  const startedAt = Date.now();
  const company = getCompanyConfig(ticker);
  const filingDir = getFilingDirectory(company.ticker, filingDate);
  const outputPath = join(filingDir, "intelligence", "semantic-topic-matches.json");

  if (!fileExists(topicEmbeddingsPath)) {
    throw new Error("Topic embeddings are missing. Run npm run topics:embed first.");
  }

  const topicEmbeddings = await readJsonFile<TopicEmbeddingRegistry>(topicEmbeddingsPath);
  const themeEmbeddings = await generateThemeEmbeddings(company.ticker, filingDate);
  const matches = matchThemesToTopics(themeEmbeddings, topicEmbeddings);
  const matchFile = buildSemanticTopicMatchFile({
    themeEmbeddings,
    topicEmbeddings,
    matches,
    generatedAt: getCurrentTimestamp(),
  });
  const reviewQueue = await writeTopicAssignmentReviewQueue(matches);

  await writeJsonFile(outputPath, matchFile);

  logger.info("Semantic topic matching complete.", {
    ticker: company.ticker,
    filing_date: filingDate,
    duration_ms: Date.now() - startedAt,
    matches: matches.length,
    pending_review: reviewQueue.items.length,
  });

  for (const match of matches) {
    const selectedCandidate = match.candidates[0];
    logger.info("Semantic topic match.", {
      ticker: company.ticker,
      filing_date: filingDate,
      theme: match.theme,
      candidate_topic: match.selected_topic,
      cosine_similarity: selectedCandidate?.cosine_similarity ?? 0,
      category_bonus: selectedCandidate?.category_bonus ?? 0,
      variant_bonus: selectedCandidate?.variant_bonus ?? 0,
      final_score: selectedCandidate?.final_score ?? 0,
      confidence: match.confidence,
      decision: match.decision,
    });
  }

  return matchFile;
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker || !filingDate) {
    logger.error("Usage: npm run topics:match -- <ticker> <filing-date>", {});
    process.exitCode = 1;
  } else {
    matchTopicsForFiling(ticker, filingDate).catch((error) => {
      logger.error("Semantic topic matching failed.", {
        ticker,
        filing_date: filingDate,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
