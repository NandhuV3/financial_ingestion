export type SecSubmissionResponse = {
  name: string;
  filings: {
    recent: {
      filingDate: string[];
      form: string[];
      accessionNumber: string[];
    };
  };
};

export type SecIngestionResult = {
  filingDate: string;
  accessionNumber: string;
  filingIndexUrl: string;
  filingHtmlUrl: string;
};

export type SectionDeduplicationReport = {
  input_file: string;
  output_file: string;
  original_characters: number;
  deduplicated_characters: number;
  characters_removed: number;
  duplicate_blocks_removed: number;
};

export type DeduplicationReport = {
  ticker: string;
  sections: SectionDeduplicationReport[];
  totals: {
    original_characters: number;
    deduplicated_characters: number;
    characters_removed: number;
    duplicate_blocks_removed: number;
  };
};

export type SectionOverlapDeduplicationReport = {
  input_file: string;
  output_file: string;
  original_characters: number;
  final_characters: number;
  characters_removed: number;
  reduction_percentage: number;
  original_paragraphs: number;
  removed_contained: number;
  removed_overlap: number;
  final_paragraphs: number;
};

export type OverlapDeduplicationReport = {
  ticker: string;
  sections: SectionOverlapDeduplicationReport[];
  totals: {
    original_characters: number;
    final_characters: number;
    characters_removed: number;
    removed_contained: number;
    removed_overlap: number;
  };
};

export type NormalizationStats = {
  originalCharacters: number;
  normalizedCharacters: number;
  duplicateLinesRemoved: number;
  emptyLinesRemoved: number;
  artifactLinesRemoved: number;
  repeatedHeadersTrimmed: number;
  operationsApplied: string[];
};

export type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};
