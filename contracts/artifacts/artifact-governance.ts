export type ArtifactGovernance = {
  review_required: boolean;
  review_status: "not_required" | "pending" | "approved" | "rejected";
  governance_flags: string[];
};

