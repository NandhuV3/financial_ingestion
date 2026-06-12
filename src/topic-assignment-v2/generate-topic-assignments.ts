import { createLogger } from "../shared/logger.js";
import { buildTopicAssignments } from "./build-topic-assignments.js";

const logger = createLogger("topic-assignment-v2");
const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker || !filingDate) {
    logger.error("Usage: npm run topics:apply -- <ticker> <filing-date>", {});
    process.exitCode = 1;
  } else {
    buildTopicAssignments(ticker, filingDate).catch((error) => {
      logger.error("Failed to build topic assignments.", {
        ticker,
        filing_date: filingDate,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
