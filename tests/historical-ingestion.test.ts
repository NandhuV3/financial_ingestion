import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildHistoricalIngestionReport,
  getAvailableFilingsFromSubmission,
  mapDiscoveredFilings,
} from "../src/ingestion/historical-sec-ingestion.js";
import type { SecSubmissionResponse } from "../src/types/pipeline.types.js";

describe("historical SEC ingestion", () => {
  it("discovers filings by form type newest to oldest", () => {
    const submission: SecSubmissionResponse = {
      name: "Test Company",
      filings: {
        recent: {
          filingDate: ["2026-04-29", "2026-01-29", "2025-10-29", "2026-02-01"],
          form: ["10-Q", "10-Q", "10-K", "8-K"],
          accessionNumber: ["a2", "a1", "k1", "x1"],
        },
      },
    };

    const filings = getAvailableFilingsFromSubmission(submission, "10-Q");

    assert.deepEqual(filings, [
      {
        filingDate: "2026-04-29",
        accessionNumber: "a2",
        formType: "10-Q",
      },
      {
        filingDate: "2026-01-29",
        accessionNumber: "a1",
        formType: "10-Q",
      },
    ]);
  });

  it("maps discovered filings into report shape", () => {
    const discovered = mapDiscoveredFilings([
      {
        filingDate: "2026-04-29",
        accessionNumber: "0000789019-26-000123",
        formType: "10-Q",
      },
    ]);

    assert.deepEqual(discovered, [
      {
        filing_date: "2026-04-29",
        form_type: "10-Q",
        accession_number: "0000789019-26-000123",
      },
    ]);
  });

  it("derives summary counts from detailed report entries", () => {
    const report = buildHistoricalIngestionReport({
      startedAt: "2026-06-02T00:00:00.000Z",
      completedAt: "2026-06-02T00:00:02.500Z",
      requested: 3,
      discovered: [
        {
          filingDate: "2026-04-29",
          accessionNumber: "a3",
          formType: "10-Q",
        },
        {
          filingDate: "2026-01-28",
          accessionNumber: "a2",
          formType: "10-Q",
        },
        {
          filingDate: "2025-10-29",
          accessionNumber: "a1",
          formType: "10-Q",
        },
      ],
      downloaded: [
        {
          filing_date: "2026-04-29",
          reason: "download_success",
        },
      ],
      skipped: [
        {
          filing_date: "2026-01-28",
          reason: "already_exists",
        },
      ],
      failed: [
        {
          filing_date: "2025-10-29",
          reason: "download_failed",
          error: "SEC filing HTML request failed: 404 Not Found",
        },
      ],
    });

    assert.equal(report.duration_ms, 2500);
    assert.equal(report.requested, 3);
    assert.equal(report.downloaded_count, 1);
    assert.equal(report.skipped_count, 1);
    assert.equal(report.failed_count, 1);
    assert.equal(report.discovered.length, 3);
  });

  it("records supported skipped and failed reasons", () => {
    const report = buildHistoricalIngestionReport({
      startedAt: "2026-06-02T00:00:00.000Z",
      completedAt: "2026-06-02T00:00:00.000Z",
      requested: 2,
      discovered: [],
      downloaded: [],
      skipped: [
        {
          filing_date: "2026-01-28",
          reason: "already_exists",
        },
      ],
      failed: [
        {
          filing_date: "2025-10-29",
          reason: "download_failed",
          error: "Primary filing document not found",
        },
      ],
    });

    assert.equal(report.skipped[0].reason, "already_exists");
    assert.equal(report.failed[0].reason, "download_failed");
    assert.equal(report.failed[0].error, "Primary filing document not found");
  });
});
