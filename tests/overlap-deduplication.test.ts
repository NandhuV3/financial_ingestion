import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deduplicateOverlapText } from "../src/processing/deduplicate-overlap.js";

describe("overlap deduplication", () => {
  it("removes contained paragraphs and keeps the larger paragraph", () => {
    const smallParagraph = "The company faces cybersecurity risks.";
    const largeParagraph = "The company faces cybersecurity risks. The company also faces operational risks.";
    const input = `${smallParagraph}\n\n${largeParagraph}`;

    const result = deduplicateOverlapText(input);

    assert.equal(result.text, largeParagraph);
    assert.equal(result.originalParagraphs, 2);
    assert.equal(result.finalParagraphs, 1);
    assert.equal(result.removedContained, 1);
    assert.equal(result.removedOverlap, 0);
  });
});
