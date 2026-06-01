export const reportSections = [
  {
    section: "management_discussion",
    processed: "management-discussion.txt",
    exactDeduped: "management-discussion.deduped.txt",
    overlapDeduped: "management-discussion.overlap-deduped.txt",
    normalized: "management-discussion.cleaned.txt",
    chunks: "management-discussion.chunks.json",
  },
  {
    section: "risk_factors",
    processed: "risk-factors.txt",
    exactDeduped: "risk-factors.deduped.txt",
    overlapDeduped: "risk-factors.overlap-deduped.txt",
    normalized: "risk-factors.cleaned.txt",
    chunks: "risk-factors.chunks.json",
  },
] as const;

export type ReportSectionFile = (typeof reportSections)[number];
