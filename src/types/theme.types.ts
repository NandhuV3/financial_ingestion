export type ThemeImportance = "high" | "medium" | "low";

export type Theme = {
  theme: string;
  category: string;
  importance: ThemeImportance;
  summary: string;
  evidence: string[];
};

export type ThemeOutput = {
  company: string;
  ticker: string;
  filing_date: string;
  themes: Theme[];
};
