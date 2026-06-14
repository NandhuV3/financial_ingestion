import { constants } from "node:fs";
import { access, mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { CompanyKnowledge } from "./types/company-knowledge.types.js";

export interface CompanyKnowledgeRepository {
  loadCurrent(ticker: string): Promise<CompanyKnowledge | null>;

  loadVersion(
    ticker: string,
    version: number
  ): Promise<CompanyKnowledge | null>;

  save(
    ticker: string,
    artifact: CompanyKnowledge
  ): Promise<void>;

  exists(ticker: string): Promise<boolean>;

  listVersions(ticker: string): Promise<number[]>;
}

export class FileCompanyKnowledgeRepository implements CompanyKnowledgeRepository {
  constructor(private readonly warehouseRoot = join(process.cwd(), "warehouse")) {}

  async loadCurrent(ticker: string): Promise<CompanyKnowledge | null> {
    return this.readArtifact(this.currentPath(ticker));
  }

  async loadVersion(ticker: string, version: number): Promise<CompanyKnowledge | null> {
    return this.readArtifact(this.archiveVersionPath(ticker, version));
  }

  async save(ticker: string, artifact: CompanyKnowledge): Promise<void> {
    if (!artifact) {
      throw new Error("Company Knowledge artifact is required.");
    }

    const versions = await this.listVersions(ticker);
    const nextVersion = versions.length === 0 ? 1 : Math.max(...versions) + 1;
    const archivePath = this.archiveVersionPath(ticker, nextVersion);
    const currentPath = this.currentPath(ticker);

    try {
      await mkdir(dirname(archivePath), { recursive: true });
      await writeFile(archivePath, serializeArtifact(artifact), { encoding: "utf8", flag: "wx" });
      await access(archivePath, constants.F_OK);
      await this.replaceCurrentAtomically(currentPath, artifact);
    } catch (error) {
      throw new Error(`Failed to save Company Knowledge for ${normalizeTicker(ticker)}: ${errorMessage(error)}`);
    }
  }

  async exists(ticker: string): Promise<boolean> {
    return pathExists(this.currentPath(ticker));
  }

  async listVersions(ticker: string): Promise<number[]> {
    const archiveDirectory = this.archiveDirectory(ticker);

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

      throw new Error(`Failed to list Company Knowledge versions for ${normalizeTicker(ticker)}: ${errorMessage(error)}`);
    }
  }

  private async readArtifact(path: string): Promise<CompanyKnowledge | null> {
    try {
      return JSON.parse(await readFile(path, "utf8")) as CompanyKnowledge;
    } catch (error) {
      if (isMissingFileError(error)) {
        return null;
      }

      if (error instanceof SyntaxError) {
        throw new Error(`Invalid Company Knowledge JSON at ${path}: ${error.message}`);
      }

      throw new Error(`Failed to read Company Knowledge at ${path}: ${errorMessage(error)}`);
    }
  }

  private async replaceCurrentAtomically(path: string, artifact: CompanyKnowledge): Promise<void> {
    await mkdir(dirname(path), { recursive: true });

    const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`;

    await writeFile(tempPath, serializeArtifact(artifact), "utf8");
    await rename(tempPath, path);
  }

  private currentPath(ticker: string): string {
    return join(this.companyKnowledgeDirectory(ticker), "current.json");
  }

  private archiveVersionPath(ticker: string, version: number): string {
    return join(this.archiveDirectory(ticker), `${version}.json`);
  }

  private archiveDirectory(ticker: string): string {
    return join(this.companyKnowledgeDirectory(ticker), "archive");
  }

  private companyKnowledgeDirectory(ticker: string): string {
    return join(this.warehouseRoot, "companies", normalizeTicker(ticker), "company-knowledge");
  }
}

function serializeArtifact(artifact: CompanyKnowledge): string {
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

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
