import type { ReviewStatus } from "./contract.js";
import type { ReviewQueueEntry } from "./types.js";

export interface ReviewQueueRepository {
  create(entry: ReviewQueueEntry): Promise<void>;
  updateStatus(reviewId: string, status: ReviewStatus): Promise<void>;
  getById(reviewId: string): Promise<ReviewQueueEntry | null>;
  findByStatus(status: ReviewStatus): Promise<ReviewQueueEntry[]>;
  findByCandidate(candidateArtifactId: string): Promise<ReviewQueueEntry[]>;
}

export class InMemoryReviewQueueRepository implements ReviewQueueRepository {
  private readonly entries = new Map<string, ReviewQueueEntry>();

  async create(entry: ReviewQueueEntry): Promise<void> {
    this.entries.set(entry.review_id, clone(entry));
  }

  async updateStatus(reviewId: string, status: ReviewStatus): Promise<void> {
    const entry = this.entries.get(reviewId);

    if (!entry) {
      return;
    }

    this.entries.set(reviewId, {
      ...entry,
      status,
    });
  }

  async getById(reviewId: string): Promise<ReviewQueueEntry | null> {
    const entry = this.entries.get(reviewId);

    return entry ? clone(entry) : null;
  }

  async findByStatus(status: ReviewStatus): Promise<ReviewQueueEntry[]> {
    return [...this.entries.values()]
      .filter((entry) => entry.status === status)
      .map((entry) => clone(entry));
  }

  async findByCandidate(candidateArtifactId: string): Promise<ReviewQueueEntry[]> {
    return [...this.entries.values()]
      .filter((entry) => entry.candidate_artifact_id === candidateArtifactId)
      .map((entry) => clone(entry));
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

