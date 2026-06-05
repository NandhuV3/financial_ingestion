import { join } from "node:path";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { createLogger } from "../shared/logger.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import type { SemanticTopicMatchFile } from "../topic-intelligence/semantic-topic.types.js";
import type { TopicReviewCandidate, TopicReviewQueue } from "./assignment.types.js";

const logger = createLogger("topic-assignment-v2-review");
const reviewQueuePath = join(process.cwd(), "data", "review", "topic-assignment-review.json");

export async function buildTopicReviewQueue(ticker: string, filingDate: string): Promise<TopicReviewQueue> {
  const startedAt = Date.now();
  const normalizedTicker = ticker.trim().toUpperCase();
  const filingDir = getFilingDirectory(normalizedTicker, filingDate);
  const matchesPath = join(filingDir, "intelligence", "semantic-topic-matches.json");
  const matchFile = await readJsonFile<SemanticTopicMatchFile>(matchesPath);
  const candidates = buildReviewCandidates(matchFile);
  const queue: TopicReviewQueue = {
    generated_at: getCurrentTimestamp(),
    ticker: normalizedTicker,
    filing_date: filingDate,
    candidates,
  };

  await writeJsonFile(reviewQueuePath, queue);

  logger.info("Topic assignment review queue built.", {
    ticker: normalizedTicker,
    filing_date: filingDate,
    duration_ms: Date.now() - startedAt,
    pending_count: candidates.length,
  });

  return queue;
}

export function buildReviewCandidates(matchFile: SemanticTopicMatchFile): TopicReviewCandidate[] {
  return matchFile.matches.map((match) => ({
    ...match,
    ticker: matchFile.ticker,
    filing_date: matchFile.filing_date,
    reviewed_topic_id: match.selected_topic,
    review_status: "pending_review",
    recommendation_method: "semantic",
    recommendation_reason: match.match_reason,
    decision: "pending_review",
  }));
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker || !filingDate) {
    logger.error("Usage: npm run topics:review-queue -- <ticker> <filing-date>", {});
    process.exitCode = 1;
  } else {
    buildTopicReviewQueue(ticker, filingDate).catch((error) => {
      logger.error("Failed to build topic assignment review queue.", {
        ticker,
        filing_date: filingDate,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
