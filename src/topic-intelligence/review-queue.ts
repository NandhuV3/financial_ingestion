import { join } from "node:path";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import type { SemanticTopicMatch, TopicAssignmentReviewQueue } from "./semantic-topic.types.js";

export async function writeTopicAssignmentReviewQueue(matches: SemanticTopicMatch[]): Promise<TopicAssignmentReviewQueue> {
  const queue: TopicAssignmentReviewQueue = {
    generated_at: getCurrentTimestamp(),
    items: matches.filter((match) => match.decision === "pending_review"),
  };

  await writeJsonFile(getReviewQueuePath(), queue);
  return queue;
}

function getReviewQueuePath(): string {
  return join(process.cwd(), "data", "review", "topic-assignment-review.json");
}
