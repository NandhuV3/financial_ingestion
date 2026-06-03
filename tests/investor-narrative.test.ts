import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildNarrativePrompt,
  buildNarrativePromptInput,
  calculateNarrativeInputHash,
} from "../src/narratives/build-narrative-prompt.js";
import {
  decideNarrativeGeneration,
  readNarrativeMetadata,
  requestInvestorNarrative,
  writeNarrativeMetadata,
} from "../src/narratives/generate-investor-narrative.js";
import type { QuarterChangeReport } from "../src/change-engine/change.types.js";
import type { InvestorInsight } from "../src/insights/insight.types.js";
import type { InvestorNarrative, NarrativeMetadata } from "../src/narratives/narrative.types.js";
import type { FilingMetadata } from "../src/types/pipeline.types.js";

describe("investor narrative layer", () => {
  it("generates stable input hashes from structured prompt input", () => {
    const input = buildNarrativePromptInput(structuredArtifacts());

    assert.equal(calculateNarrativeInputHash(input), calculateNarrativeInputHash(input));
  });

  it("skips generation when output exists and input hash is unchanged", () => {
    const decision = decideNarrativeGeneration({
      outputExists: true,
      previousInputHash: "hash-1",
      currentInputHash: "hash-1",
    });

    assert.equal(decision.shouldGenerate, false);
    assert.equal(decision.status, "skipped");
    assert.equal(decision.reason, "unchanged");
  });

  it("generates when output is missing even if metadata hash matches", () => {
    const decision = decideNarrativeGeneration({
      outputExists: false,
      previousInputHash: "hash-1",
      currentInputHash: "hash-1",
    });

    assert.equal(decision.shouldGenerate, true);
    assert.equal(decision.status, "generated");
  });

  it("builds prompts from structured intelligence only", () => {
    const prompt = buildNarrativePrompt(buildNarrativePromptInput(structuredArtifacts()));

    assert.match(prompt, /quarter_changes/);
    assert.match(prompt, /investor_signals/);
    assert.match(prompt, /Do not invent facts/);
    assert.doesNotMatch(prompt, /MANAGEMENT DISCUSSION/);
    assert.doesNotMatch(prompt, /RISK FACTORS/);
  });

  it("persists narrative metadata", async () => {
    const dir = await mkdtemp(join(tmpdir(), "narrative-metadata-"));
    const metadataPath = join(dir, "narrative-metadata.json");
    const metadata: NarrativeMetadata = {
      input_hash: "hash-1",
      generated_at: "2026-06-03T00:00:00.000Z",
      model: "gpt-4o-mini",
    };

    await writeNarrativeMetadata(metadataPath, metadata);

    assert.deepEqual(await readNarrativeMetadata(metadataPath), metadata);
  });

  it("uses mocked OpenAI responses", async () => {
    const narrative = await requestInvestorNarrative(async () => mockNarrative(), {
      model: "gpt-4o-mini",
      systemPrompt: "system",
      prompt: "prompt",
      schema: {},
    });

    assert.equal(narrative.headline, "Mock headline");
    assert.equal(narrative.investor_takeaway, "Mock takeaway");
  });
});

function structuredArtifacts() {
  const filingMetadata = metadata("2026-04-29");
  const quarterChangeReport: QuarterChangeReport = {
    company: "Microsoft",
    ticker: "MSFT",
    previous_filing: metadata("2026-01-28"),
    current_filing: filingMetadata,
    summary: {
      new_categories: 1,
      removed_categories: 0,
      importance_increases: 0,
      importance_decreases: 0,
      evidence_increases: 1,
      evidence_decreases: 0,
    },
    changes: [
      {
        change_type: "NEW_CATEGORY",
        category: "investments",
        previous_importance: null,
        current_importance: "high",
        previous_evidence_count: 0,
        current_evidence_count: 3,
        previous_theme_names: [],
        current_theme_names: ["Investment in AI Infrastructure"],
      },
    ],
  };
  const investorInsight: InvestorInsight = {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: "2026-04-29",
    previous_filing_date: "2026-01-28",
    headline: "Microsoft shows cloud revenue growth.",
    executive_summary: "Structured summary.",
    key_changes: ["investments emerged as a new category."],
    new_topics: ["investments"],
    removed_topics: [],
    risks: ["competition remains high importance."],
    opportunities: ["cloud growth remains high importance."],
    source: {
      current_filing: filingMetadata,
      previous_filing: metadata("2026-01-28"),
      quarter_change_report: "comparison/quarter-change-report.json",
      themes: "intelligence/themes.json",
    },
  };

  return {
    filingMetadata,
    quarterChangeReport,
    investorInsight,
    themesWithTopics: null,
  };
}

function metadata(filingDate: string): FilingMetadata {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: filingDate,
    form_type: "10-Q",
    accession_number: `test-${filingDate}`,
  };
}

function mockNarrative(): InvestorNarrative {
  return {
    headline: "Mock headline",
    executive_summary: "Mock executive summary",
    what_changed: "Mock changes",
    bull_case: "Mock bull case",
    bear_case: "Mock bear case",
    investor_takeaway: "Mock takeaway",
  };
}
