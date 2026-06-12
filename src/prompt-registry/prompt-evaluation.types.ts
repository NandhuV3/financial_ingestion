export type PromptEvaluation = {
  evaluation_id: string;
  prompt_id: string;
  prompt_version: string;
  overall_score: number;
  passed: boolean;
  warnings: string[];
  failures: string[];
  compared_against?: string;
  created_at: string;
};
