import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { getStructuredIntelligencePath } from "./structured-intelligence.paths.js";
import type { StructuredIntelligence } from "./types/structured-intelligence.types.js";

export interface StructuredIntelligenceRepository {
  save(
    ticker: string,
    filingDate: string,
    artifact: StructuredIntelligence,
  ): Promise<void>;

  load(
    ticker: string,
    filingDate: string,
  ): Promise<StructuredIntelligence | null>;
}

export class FileStructuredIntelligenceRepository implements StructuredIntelligenceRepository {
  async save(
    ticker: string,
    filingDate: string,
    artifact: StructuredIntelligence,
  ): Promise<void> {
    await writeJsonFile(getStructuredIntelligencePath(ticker, filingDate), artifact);
  }

  async load(
    ticker: string,
    filingDate: string,
  ): Promise<StructuredIntelligence | null> {
    const path = getStructuredIntelligencePath(ticker, filingDate);

    if (!fileExists(path)) {
      return null;
    }

    return readJsonFile<StructuredIntelligence>(path);
  }
}
