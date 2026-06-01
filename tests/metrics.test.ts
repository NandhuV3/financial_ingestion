import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateEvidenceCoverage } from "../src/reporting/generate-company-report.js";

describe("reporting metrics", () => {
  it("calculates evidence coverage percentage", () => {
    assert.equal(calculateEvidenceCoverage(10, 4), 40);
  });

  it("returns zero coverage when there are no chunks", () => {
    assert.equal(calculateEvidenceCoverage(0, 4), 0);
  });
});
