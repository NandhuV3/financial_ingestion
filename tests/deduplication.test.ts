import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deduplicateText } from "../src/processing/deduplicate-sections.js";

describe("deduplication", () => {
  it("removes exact duplicate consecutive paragraphs and preserves ordering", () => {
    const input = "Paragraph A\n\nParagraph A\n\nParagraph B";

    const result = deduplicateText(input);

    assert.equal(result.text, "Paragraph A\n\nParagraph B\n");
    assert.equal(result.duplicateBlocksRemoved, 1);
  });

  it("removes exact duplicate consecutive lines", () => {
    const input = "Heading A\nHeading A\nParagraph A";

    const result = deduplicateText(input);

    assert.equal(result.text, "Heading A\nParagraph A\n");
  });
});
