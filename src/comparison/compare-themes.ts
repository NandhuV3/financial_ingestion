import type { Theme, ThemeOutput } from "../types/theme.types.js";
import type { ThemeComparisonResult } from "./comparison.types.js";

export function normalizeThemeName(themeName: string): string {
  return themeName.toLowerCase().trim().replace(/\s+/g, " ");
}

export function compareThemes(
  previousThemes: ThemeOutput | null,
  currentThemes: ThemeOutput,
): ThemeComparisonResult {
  const previousThemeMap = buildThemeMap(previousThemes?.themes ?? []);
  const currentThemeMap = buildThemeMap(currentThemes.themes);
  const newThemes: Theme[] = [];
  const removedThemes: Theme[] = [];
  const unchangedThemes: Theme[] = [];

  for (const [themeName, theme] of currentThemeMap) {
    if (previousThemeMap.has(themeName)) {
      unchangedThemes.push(theme);
    } else {
      newThemes.push(theme);
    }
  }

  for (const [themeName, theme] of previousThemeMap) {
    if (!currentThemeMap.has(themeName)) {
      removedThemes.push(theme);
    }
  }

  return {
    newThemes,
    removedThemes,
    unchangedThemes,
  };
}

function buildThemeMap(themes: Theme[]): Map<string, Theme> {
  const themeMap = new Map<string, Theme>();

  for (const theme of themes) {
    themeMap.set(normalizeThemeName(theme.theme), theme);
  }

  return themeMap;
}
