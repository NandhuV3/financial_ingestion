import { join } from "node:path";
import { readJsonArtifact } from "./read-extraction.js";
import type { ReportThemeOutput } from "../../types/report.types.js";

export type ThemeArtifact = {
  file: string;
  theme_output: ReportThemeOutput | null;
};

export async function readThemes(companyDataDir: string): Promise<ThemeArtifact> {
  const path = join(companyDataDir, "intelligence", "themes.json");

  return {
    file: path,
    theme_output: await readJsonArtifact(path) as ReportThemeOutput | null,
  };
}
