import type { Theme, ThemeOutput } from "../types/theme.types.js";
import type { SemanticTopicMatch } from "../topic-intelligence/semantic-topic.types.js";

export type TopicAssignmentMethod = "manual" | "semantic" | "variant_match";

export type TopicAssignmentStatus = "approved" | "pending_review" | "rejected";

export type TopicApprovalDecision = "approved" | "rejected";

// export type TopicApproval = {
//   theme: string;
//   topic_id: string;
//   decision: TopicApprovalDecision;
//   reviewed_at: string;
//   ticker?: string;
//   filing_date?: string;
// };

export interface TopicApproval {
  theme: string;
  topic_id: string;
  decision: "approved" | "rejected";
  reviewed_at: string;
}

export type TopicApprovalFile = {
  approvals: TopicApproval[];
};

export type TopicReviewCandidate = SemanticTopicMatch & {
  ticker: string;
  filing_date: string;
  reviewed_topic_id: string;
  review_status: "pending_review";
};

export type TopicReviewQueue = {
  generated_at: string;
  ticker: string;
  filing_date: string;
  candidates: TopicReviewCandidate[];
};

export type TopicAssignedThemeV2 = Theme & {
  topic_id: string | null;
  confidence: number | null;
  assignment_method: TopicAssignmentMethod | null;
  assignment_status: TopicAssignmentStatus;
};

export type TopicAssignmentOutputV2 = Omit<ThemeOutput, "themes"> & {
  themes: TopicAssignedThemeV2[];
};

export type TopicAssignmentSummary = {
  approved_count: number;
  pending_count: number;
  rejected_count: number;
};
