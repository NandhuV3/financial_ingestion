import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BusinessSignalArtifact } from "../src/business-signal-intelligence/types/business-signal.types.js";
import { deriveReportingPeriodFromMetadata } from "../src/business-signal-intelligence/generate-business-signals-command.js";
import type { QuarterChangeReport } from "../src/change-engine/change.types.js";
import type { CompanyKnowledge } from "../src/company-knowledge/types/company-knowledge.types.js";
import {
  countUnderstandingsByKind,
  generateQuarterUnderstandingCommand,
} from "../src/quarter-understanding-intelligence/generate-quarter-understanding-command.js";
import type { QuarterUnderstandingArtifact } from "../src/quarter-understanding-intelligence/types/quarter-understanding.types.js";
import type { TopicEvolutionReport } from "../src/topic-evolution/topic-evolution.types.js";
import type { FilingMetadata } from "../src/types/pipeline.types.js";

describe("generate quarter understanding cli command", () => {
  it("derives reporting period using the shared filing metadata pattern", () => {
    assert.equal(deriveReportingPeriodFromMetadata(filingMetadata("2026-04-29")), "2026-Q2");
  });

  it("counts understandings by deterministic owner-facing kind", () => {
    assert.deepEqual(countUnderstandingsByKind(quarterUnderstandingArtifact()), {
      strength: 1,
      concern: 1,
      change: 1,
      watchlist: 1,
    });
  });

  it("fails fast when Company Knowledge is missing", async () => {
    await withTempWorkspace(async ({ filingDirectory }) => {
      await writeJson(join(filingDirectory, "metadata", "filing.json"), filingMetadata());

      await assert.rejects(
        () => generateQuarterUnderstandingCommand("MSFT", "2026-04-29"),
        /Missing Company Knowledge.*npm run generate:company-knowledge -- MSFT 2026-04-29/,
      );
    });
  });

  it("loads prerequisites, persists Quarter Understanding, and logs command output", async () => {
    await withTempWorkspace(async ({ filingDirectory, companyDirectory, warehouseRoot }) => {
      const logs: string[] = [];
      const originalConsoleLog = console.log;

      try {
        console.log = (message?: unknown) => {
          logs.push(String(message));
        };

        await writeJson(join(filingDirectory, "metadata", "filing.json"), filingMetadata());
        await writeJson(join(filingDirectory, "comparison", "quarter-change-report.json"), quarterChange());
        await writeJson(join(companyDirectory, "reports", "topic-evolution-report.json"), topicEvolution());
        await writeJson(
          join(warehouseRoot, "companies", "MSFT", "company-knowledge", "current.json"),
          companyKnowledge(),
        );
        await writeJson(
          join(warehouseRoot, "companies", "MSFT", "business-signals", "2026-Q2", "current.json"),
          businessSignals(),
        );

        const result = await generateQuarterUnderstandingCommand("msft", "2026-04-29");
        const persisted = JSON.parse(await readFile(
          join(warehouseRoot, "companies", "MSFT", "quarter-understanding", "2026-Q2", "current.json"),
          "utf8",
        )) as QuarterUnderstandingArtifact;

        assert.equal(result.period, "2026-Q2");
        assert.equal(result.understandings.length > 0, true);
        assert.deepEqual(persisted, result);
        assert.equal(logs.some((entry) => entry.includes("Quarter Understanding generated for MSFT 2026-Q2")), true);
        assert.equal(logs.some((entry) => entry.includes("Understandings:")), true);
        assert.equal(logs.some((entry) => entry.includes("Current artifact:")), true);
      } finally {
        console.log = originalConsoleLog;
      }
    });
  });
});

async function withTempWorkspace(
  callback: (params: {
    tempDirectory: string;
    filingDirectory: string;
    companyDirectory: string;
    warehouseRoot: string;
  }) => Promise<void>,
): Promise<void> {
  const previousCwd = process.cwd();
  const previousWarehouseRoot = process.env.PARTNER_WAREHOUSE_ROOT;
  const tempDirectory = await mkdtemp(join(tmpdir(), "quarter-understanding-command-"));
  const companyDirectory = join(tempDirectory, "data", "MSFT");
  const filingDirectory = join(companyDirectory, "filings", "2026-04-29");
  const warehouseRoot = join(tempDirectory, "warehouse");

  try {
    process.chdir(tempDirectory);
    process.env.PARTNER_WAREHOUSE_ROOT = warehouseRoot;
    await callback({ tempDirectory, filingDirectory, companyDirectory, warehouseRoot });
  } finally {
    process.chdir(previousCwd);

    if (previousWarehouseRoot === undefined) {
      delete process.env.PARTNER_WAREHOUSE_ROOT;
    } else {
      process.env.PARTNER_WAREHOUSE_ROOT = previousWarehouseRoot;
    }

    await rm(tempDirectory, { recursive: true, force: true });
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function filingMetadata(filingDate = "2026-04-29"): FilingMetadata {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: filingDate,
    form_type: "10-Q",
    accession_number: `accession-${filingDate}`,
  };
}

function companyKnowledge(): CompanyKnowledge {
  return {
    company: "Microsoft",
    business_description: "Microsoft provides software and cloud services.",
    business_model: {
      value_creation: "Microsoft provides software and cloud services.",
      monetization: "cloud subscriptions",
      revenue_structure: "mixed",
    },
    products: ["cloud services"],
    customers: ["enterprise customers"],
    revenue_drivers: ["cloud subscriptions"],
    competitive_positioning: [
      {
        signal: "developer ecosystem",
        source_type: "observed",
      },
    ],
    operating_model: ["cloud infrastructure"],
    key_dependencies: [
      {
        description: "data center capacity",
        type: "technology",
      },
    ],
    strategic_priorities: ["AI infrastructure"],
    risks: ["competition"],
    opportunities: ["cloud adoption"],
    confidence: {
      overall: 0.9,
      filing_depth: 0.5,
      field_coverage: 1,
    },
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "company-knowledge-builder-v1",
      knowledge_version: 2,
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: "company-knowledge-hash",
    },
    lineage: {
      source_filings: [
        {
          id: "2026",
          period: "2026-Q2",
          type: "10-Q",
        },
      ],
      derived_from: ["structured-intelligence", "filing-metadata"],
      model_version: "deterministic-v1",
      prompt_version: "none",
    },
  };
}

function businessSignals(): BusinessSignalArtifact {
  return {
    company: "Microsoft",
    period: "2026-Q2",
    signals: [
      {
        signal_id: "signal_revenue_cloud",
        signal_type: "revenue_driver",
        category: "revenue",
        summary: "cloud subscriptions",
        direction: "neutral",
        magnitude: "low",
        confidence: 0.8,
        evidence: [
          {
            evidence_id: "evidence_revenue_cloud",
            source: "business-signals",
            description: "cloud subscriptions",
          },
        ],
      },
    ],
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "business-signal-builder-v1",
      signal_version: 1,
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: "business-signal-hash",
    },
    lineage: {
      derived_from: [],
      source_filings: [
        {
          id: "2026",
          period: "2026-Q2",
          type: "10-Q",
        },
      ],
      model_version: "deterministic-v1",
      prompt_version: "none",
    },
  };
}

function quarterChange(): QuarterChangeReport {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    previous_filing: filingMetadata("2026-01-28"),
    current_filing: filingMetadata("2026-04-29"),
    summary: {
      new_categories: 0,
      removed_categories: 0,
      importance_increases: 1,
      importance_decreases: 0,
      evidence_increases: 0,
      evidence_decreases: 0,
    },
    changes: [],
    topic_changes: [
      {
        change_type: "TOPIC_NEW",
        topic_id: "cloud_demand",
        previous_categories: [],
        current_categories: ["growth"],
        previous_theme_names: [],
        current_theme_names: ["Cloud demand"],
        previous_importance: null,
        current_importance: "high",
        previous_evidence_count: 0,
        current_evidence_count: 3,
      },
    ],
    topic_summary: {
      persisted_topics: 0,
      evolved_topics: 0,
      intensified_topics: 0,
      weakened_topics: 0,
    },
  };
}

function topicEvolution(): TopicEvolutionReport {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    generated_at: "2026-06-08T00:00:00.000Z",
    history_start: "2026-01-28",
    history_end: "2026-04-29",
    filings_analyzed: 2,
    filing_dates: ["2026-01-28", "2026-04-29"],
    topic_registry_version: "test",
    topic_registry_hash: "hash",
    assignment_policy: {
      included_statuses: ["assigned", "low_confidence"],
      excluded_statuses: ["unassigned", "missing"],
    },
    summary: {
      topics_analyzed: 0,
      topics_present_latest: 0,
      new_topics: 0,
      persistent_topics: 0,
      recurring_topics: 0,
      dormant_topics: 0,
      disappeared_topics: 0,
      strengthening_topics: 0,
      weakening_topics: 0,
      stable_topics: 0,
      mixed_topics: 0,
      unknown_trend_topics: 0,
      insufficient_history_topics: 0,
    },
    topics: [],
    diagnostics: {
      assigned_topics_used: 0,
      unassigned_topics_ignored: 0,
      themes_without_topic_ignored: 0,
      missing_themes_with_topics_files: [],
      filings_with_no_assigned_topics: [],
      duration_ms: 0,
    },
  };
}

function quarterUnderstandingArtifact(): QuarterUnderstandingArtifact {
  return {
    company: "Microsoft",
    period: "2026-Q2",
    understandings: [
      understanding("Revenue driver remains central: cloud subscriptions."),
      understanding("Risk identified in Company Knowledge: competition."),
      understanding("New topic observed: cloud demand."),
      understanding("Topic needs monitoring: legacy licensing."),
    ],
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "quarter-understanding-builder-v1",
      model_version: "deterministic-builder-v1",
      prompt_version: "none",
      generated_at: "2026-06-08T00:00:00.000Z",
      understanding_version: 1,
      input_hash: "understanding-hash",
    },
    lineage: {
      derived_from: [],
      source_filings: [],
    },
  };
}

function understanding(summary: string): QuarterUnderstandingArtifact["understandings"][number] {
  return {
    understanding_id: `understanding_${summary.length}`,
    semantic_anchor_key: summary.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    business_key: {
      company: "Microsoft",
      category: "revenue",
      topic: "cloud",
    },
    category: "revenue",
    summary,
    importance: "medium",
    confidence: {
      score: 0.5,
      evidence_count: 1,
      source_reliability: "low",
      signal_agreement: "corroborating",
      company_knowledge_alignment: "consistent",
    },
    evidence: {
      signal_refs: [],
      company_knowledge_ref: null,
      evidence_context: summary,
    },
  };
}
