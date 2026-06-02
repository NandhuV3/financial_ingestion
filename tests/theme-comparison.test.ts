import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareThemes, normalizeThemeName } from "../src/comparison/compare-themes.js";
import type { Theme, ThemeOutput } from "../src/types/theme.types.js";

describe("theme comparison", () => {
  it("detects new themes", () => {
    const result = compareThemes(
      themeOutput([theme("Cloud Growth")]),
      themeOutput([theme("Cloud Growth"), theme("AI Investments")]),
    );

    assert.deepEqual(result.newThemes.map((entry) => entry.theme), ["AI Investments"]);
  });

  it("detects removed themes", () => {
    const result = compareThemes(
      themeOutput([theme("Cloud Growth"), theme("Supply Chain Risk")]),
      themeOutput([theme("Cloud Growth")]),
    );

    assert.deepEqual(result.removedThemes.map((entry) => entry.theme), ["Supply Chain Risk"]);
  });

  it("detects unchanged themes", () => {
    const result = compareThemes(
      themeOutput([theme("Cloud Growth")]),
      themeOutput([theme("Cloud Growth")]),
    );

    assert.deepEqual(result.unchangedThemes.map((entry) => entry.theme), ["Cloud Growth"]);
  });

  it("normalizes whitespace and casing for exact theme matching", () => {
    const result = compareThemes(
      themeOutput([theme("AI Investments")]),
      themeOutput([theme(" ai   investments ")]),
    );

    assert.equal(normalizeThemeName(" ai   investments "), "ai investments");
    assert.equal(result.newThemes.length, 0);
    assert.equal(result.removedThemes.length, 0);
    assert.deepEqual(result.unchangedThemes.map((entry) => entry.theme), [" ai   investments "]);
  });
});

function theme(themeName: string): Theme {
  return {
    theme: themeName,
    category: "growth",
    importance: "medium",
    summary: `${themeName} summary`,
    evidence: ["mock_001"],
  };
}

function themeOutput(themes: Theme[]): ThemeOutput {
  return {
    company: "Test Company",
    ticker: "TEST",
    filing_date: "2026-04-29",
    themes,
  };
}
