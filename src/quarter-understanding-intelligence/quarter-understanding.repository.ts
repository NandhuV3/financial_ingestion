import { constants } from "node:fs";
import { access, mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { QuarterUnderstandingArtifact } from "./types/quarter-understanding.types.js";

export interface QuarterUnderstandingRepository {
  loadCurrent(
    ticker: string,
    reportingPeriod: string
  ): Promise<QuarterUnderstandingArtifact | null>;

  loadVersion(
    ticker: string,
    reportingPeriod: string,
    version: number
  ): Promise<QuarterUnderstandingArtifact | null>;

  save(
    ticker: string,
    reportingPeriod: string,
    artifact: QuarterUnderstandingArtifact
  ): Promise<void>;

  exists(
    ticker: string,
    reportingPeriod: string
  ): Promise<boolean>;

  listVersions(
    ticker: string,
    reportingPeriod: string
  ): Promise<number[]>;
}

export class FileQuarterUnderstandingRepository implements QuarterUnderstandingRepository {
  constructor(private readonly warehouseRoot = join(process.cwd(), "warehouse")) {}

  async loadCurrent(ticker: string, reportingPeriod: string): Promise<QuarterUnderstandingArtifact | null> {
    return this.readArtifact(this.currentPath(ticker, reportingPeriod));
  }

  async loadVersion(
    ticker: string,
    reportingPeriod: string,
    version: number,
  ): Promise<QuarterUnderstandingArtifact | null> {
    return this.readArtifact(this.archiveVersionPath(ticker, reportingPeriod, version));
  }

  async save(
    ticker: string,
    reportingPeriod: string,
    artifact: QuarterUnderstandingArtifact,
  ): Promise<void> {
    if (!artifact) {
      throw new Error("Quarter Understanding artifact is required.");
    }

    const versions = await this.listVersions(ticker, reportingPeriod);
    const nextVersion = versions.length === 0 ? 1 : Math.max(...versions) + 1;
    const archivePath = this.archiveVersionPath(ticker, reportingPeriod, nextVersion);
    const currentPath = this.currentPath(ticker, reportingPeriod);

    try {
      await mkdir(dirname(archivePath), { recursive: true });
      await writeFile(archivePath, serializeArtifact(artifact), { encoding: "utf8", flag: "wx" });
      await access(archivePath, constants.F_OK);
      await this.replaceCurrentAtomically(currentPath, artifact);
    } catch (error) {
      throw new Error(
        `Failed to save Quarter Understanding for ${normalizeTicker(ticker)} ${normalizeReportingPeriod(reportingPeriod)}: ${errorMessage(error)}`,
      );
    }
  }

  async exists(ticker: string, reportingPeriod: string): Promise<boolean> {
    return pathExists(this.currentPath(ticker, reportingPeriod));
  }

  async listVersions(ticker: string, reportingPeriod: string): Promise<number[]> {
    const archiveDirectory = this.archiveDirectory(ticker, reportingPeriod);

    try {
      const entries = await readdir(archiveDirectory, { withFileTypes: true });

      return entries
        .filter((entry) => entry.isFile())
        .map((entry) => versionFromArchiveFile(entry.name))
        .filter((version): version is number => version !== null)
        .sort((left, right) => left - right);
    } catch (error) {
      if (isMissingFileError(error)) {
        return [];
      }

      throw new Error(
        `Failed to list Quarter Understanding versions for ${normalizeTicker(ticker)} ${normalizeReportingPeriod(reportingPeriod)}: ${errorMessage(error)}`,
      );
    }
  }

  private async readArtifact(path: string): Promise<QuarterUnderstandingArtifact | null> {
    try {
      return JSON.parse(await readFile(path, "utf8")) as QuarterUnderstandingArtifact;
    } catch (error) {
      if (isMissingFileError(error)) {
        return null;
      }

      if (error instanceof SyntaxError) {
        throw new Error(`Invalid Quarter Understanding JSON at ${path}: ${error.message}`);
      }

      throw new Error(`Failed to read Quarter Understanding at ${path}: ${errorMessage(error)}`);
    }
  }

  private async replaceCurrentAtomically(path: string, artifact: QuarterUnderstandingArtifact): Promise<void> {
    await mkdir(dirname(path), { recursive: true });

    const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`;

    await writeFile(tempPath, serializeArtifact(artifact), "utf8");
    await rename(tempPath, path);
  }

  private currentPath(ticker: string, reportingPeriod: string): string {
    return join(this.quarterUnderstandingDirectory(ticker, reportingPeriod), "current.json");
  }

  private archiveVersionPath(ticker: string, reportingPeriod: string, version: number): string {
    return join(this.archiveDirectory(ticker, reportingPeriod), `${version}.json`);
  }

  private archiveDirectory(ticker: string, reportingPeriod: string): string {
    return join(this.quarterUnderstandingDirectory(ticker, reportingPeriod), "archive");
  }

  private quarterUnderstandingDirectory(ticker: string, reportingPeriod: string): string {
    return join(
      this.warehouseRoot,
      "companies",
      normalizeTicker(ticker),
      "quarter-understanding",
      normalizeReportingPeriod(reportingPeriod),
    );
  }
}

function serializeArtifact(artifact: QuarterUnderstandingArtifact): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

function versionFromArchiveFile(fileName: string): number | null {
  const match = /^(\d+)\.json$/.exec(fileName);

  if (!match) {
    return null;
  }

  const version = Number(match[1]);

  return Number.isSafeInteger(version) && version > 0 ? version : null;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch (error) {
    if (isMissingFileError(error)) {
      return false;
    }

    throw error;
  }
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

function normalizeReportingPeriod(reportingPeriod: string): string {
  return reportingPeriod.trim();
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
