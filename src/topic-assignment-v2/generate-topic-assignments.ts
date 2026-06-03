import { createLogger } from "../shared/logger.js";
import { applyApprovedTopics } from "./apply-approved-topics.js";

const logger = createLogger("topic-assignment-v2");
const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker || !filingDate) {
    logger.error("Usage: npm run topics:apply -- <ticker> <filing-date>", {});
    process.exitCode = 1;
  } else {
    applyApprovedTopics(ticker, filingDate).catch((error) => {
      logger.error("Failed to apply approved topic assignments.", {
        ticker,
        filing_date: filingDate,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
