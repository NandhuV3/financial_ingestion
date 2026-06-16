import type { CompanyKnowledgeAuditEntry } from "./types.js";

export interface CompanyKnowledgeAuditRepository {
  append(entry: CompanyKnowledgeAuditEntry): Promise<void>;
  getById(entryId: string): Promise<CompanyKnowledgeAuditEntry | null>;
  findByCompany(companyId: string): Promise<CompanyKnowledgeAuditEntry[]>;
  findByCandidate(candidateArtifactId: string): Promise<CompanyKnowledgeAuditEntry[]>;
}

export class InMemoryCompanyKnowledgeAuditRepository implements CompanyKnowledgeAuditRepository {
  private readonly entries: CompanyKnowledgeAuditEntry[] = [];

  async append(entry: CompanyKnowledgeAuditEntry): Promise<void> {
    this.entries.push(clone(entry));
  }

  async getById(entryId: string): Promise<CompanyKnowledgeAuditEntry | null> {
    const entry = this.entries.find((item) => item.entry_id === entryId);

    return entry ? clone(entry) : null;
  }

  async findByCompany(companyId: string): Promise<CompanyKnowledgeAuditEntry[]> {
    return this.entries
      .filter((entry) => entry.company_id === companyId)
      .map((entry) => clone(entry));
  }

  async findByCandidate(candidateArtifactId: string): Promise<CompanyKnowledgeAuditEntry[]> {
    return this.entries
      .filter((entry) => entry.candidate_artifact_id === candidateArtifactId)
      .map((entry) => clone(entry));
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

