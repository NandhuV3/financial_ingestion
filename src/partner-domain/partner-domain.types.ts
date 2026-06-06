export type BusinessHealth = "improving" | "stable" | "weakening";

export type Conviction = "low" | "medium" | "high";

export type ForensicsSeverity = "green" | "yellow" | "red";

export type PlainLanguageMetric = {
  label: string;
  plainLanguageName: string;
  explanation: string;
  status?: BusinessHealth;
};

export type CompanyProfile = {
  ticker: string;
  companyName: string;
  tagline: string;
  whatTheyDo: string;
  whoTheyServe: string;
};

export type PartnerSummary = {
  headline: string;
  summary: string;
  businessHealth: BusinessHealth;
  conviction: Conviction;
};

export type CompanyStory = {
  whatTheyDo: string;
  whoBuys: string;
  whyTheyWin: string;
  whatCouldGoWrong: string;
};

export type CustomerSegment = {
  customerType: string;
  whyTheyBuy: string;
  importance?: "core" | "important" | "emerging";
};

export type MoneyProfile = {
  dailySales: PlainLanguageMetric;
  whatsLeftAfterCosts: PlainLanguageMetric;
  loansToExpand: PlainLanguageMetric;
  moneyInTheDrawer: PlainLanguageMetric;
  overallExplanation: string;
};

export type TrustProfile = {
  managementQuality: string;
  longTermThinking: string;
  capitalAllocation: string;
  skinInTheGame: string;
  confidence: Conviction;
  dataAvailability: "available" | "partial" | "not_available";
};

export type ForensicsSignal = {
  label: string;
  severity: ForensicsSeverity;
  explanation: string;
};

export type PartnerIntelligenceSource = {
  artifact: "company_profile" | "investor_narrative" | "investor_insight" | "topic_evolution" | "quarter_change" | "themes";
  path?: string;
  generatedAt?: string;
};

export type PartnerCompanyIntelligence = {
  ticker: string;
  companyName: string;
  asOfFilingDate: string;
  profile: CompanyProfile;
  summary: PartnerSummary;
  story: CompanyStory;
  customers: CustomerSegment[];
  money: MoneyProfile;
  trust: TrustProfile;
  forensics: ForensicsSignal[];
  sources: PartnerIntelligenceSource[];
};
