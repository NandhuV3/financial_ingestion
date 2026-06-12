export type HarnessScorecard = {
  artifact: string;
  overall_score: number;
  dimensions: {
    name: string;
    score: number;
    notes: string[];
  }[];
  warnings: string[];
  failures: string[];
};

export type HarnessReport = {
  ticker: string;
  filing_date: string;
  overall_score: number;
  artifacts: HarnessScorecard[];
  warnings: string[];
  failures: string[];
  architecture: HarnessScorecard;
};

export type HarnessDimension = HarnessScorecard["dimensions"][number];
