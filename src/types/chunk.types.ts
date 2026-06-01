export type Chunk = {
  chunk_id: string;
  company: string;
  ticker: string;
  form_type: string;
  filing_date: string;
  section: string;
  text: string;
};

export type ChunkSection = "management_discussion" | "risk_factors";
