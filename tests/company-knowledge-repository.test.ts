import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FileCompanyKnowledgeRepository } from "../src/company-knowledge/company-knowledge.repository.js";
import type { CompanyKnowledge } from "../src/company-knowledge/company-knowledge.types.js";

describe("company knowledge repository", () => {
  it("saves current and archive versions", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileCompanyKnowledgeRepository(root);
    const first = artifact(1, "hash-1");
    const second = artifact(2, "hash-2");

    await repository.save("msft", first);
    await repository.save("MSFT", second);

    assert.deepEqual(await repository.loadCurrent("MSFT"), second);
    assert.deepEqual(await repository.loadVersion("MSFT", 1), first);
    assert.deepEqual(await repository.loadVersion("MSFT", 2), second);
    assert.deepEqual(await repository.listVersions("MSFT"), [1, 2]);
  });

  it("returns null for missing current and historical versions", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileCompanyKnowledgeRepository(root);

    assert.equal(await repository.loadCurrent("MSFT"), null);
    assert.equal(await repository.loadVersion("MSFT", 1), null);
    assert.equal(await repository.exists("MSFT"), false);
    assert.deepEqual(await repository.listVersions("MSFT"), []);
  });

  it("reports existence from current.json only", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileCompanyKnowledgeRepository(root);

    await repository.save("MSFT", artifact(1, "hash-1"));

    assert.equal(await repository.exists("MSFT"), true);
  });

  it("lists numeric archive versions oldest to newest and ignores non-version files", async () => {
    const root = await createWarehouseRoot();
    const archiveDirectory = join(root, "companies", "MSFT", "company-knowledge", "archive");
    const repository = new FileCompanyKnowledgeRepository(root);

    await mkdir(archiveDirectory, { recursive: true });
    await writeFile(join(archiveDirectory, "10.json"), "{}\n", "utf8");
    await writeFile(join(archiveDirectory, "2.json"), "{}\n", "utf8");
    await writeFile(join(archiveDirectory, "notes.txt"), "ignore\n", "utf8");

    assert.deepEqual(await repository.listVersions("MSFT"), [2, 10]);
  });

  it("throws a descriptive error for invalid JSON", async () => {
    const root = await createWarehouseRoot();
    const currentDirectory = join(root, "companies", "MSFT", "company-knowledge");
    const repository = new FileCompanyKnowledgeRepository(root);

    await mkdir(currentDirectory, { recursive: true });
    await writeFile(join(currentDirectory, "current.json"), "{bad json", "utf8");

    await assert.rejects(
      () => repository.loadCurrent("MSFT"),
      /Invalid Company Knowledge JSON/,
    );
  });

  it("persists artifacts exactly without mutating confidence, hash, lineage, or metadata", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileCompanyKnowledgeRepository(root);
    const source = artifact(7, "original-hash");

    await repository.save("MSFT", source);

    const loaded = await repository.loadCurrent("MSFT");

    assert.deepEqual(loaded, source);
    assert.equal(loaded?.metadata.knowledge_version, 7);
    assert.equal(loaded?.metadata.input_hash, "original-hash");
    assert.equal(loaded?.confidence.overall, 0.42);
    assert.equal(loaded?.lineage.model_version, "model-v7");
  });
});

async function createWarehouseRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), "company-knowledge-repository-"));
}

function artifact(version: number, inputHash: string): CompanyKnowledge {
  return {
    company: "Microsoft",
    business_description: "Microsoft provides software and cloud services.",
    business_model: {
      value_creation: "Microsoft provides software and cloud services.",
      monetization: "Software subscriptions",
      revenue_structure: "mixed",
    },
    products: ["software products"],
    customers: ["businesses"],
    revenue_drivers: ["software subscriptions"],
    competitive_positioning: [
      {
        signal: "developer ecosystem",
        source_type: "observed",
      },
    ],
    operating_model: ["cloud infrastructure"],
    key_dependencies: [],
    confidence: {
      overall: 0.42,
      filing_depth: 0.5,
      field_coverage: 0.75,
    },
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "company-knowledge-builder-v1",
      knowledge_version: version,
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: inputHash,
    },
    lineage: {
      source_filings: [
        {
          id: "0000000000-00-000000",
          period: "2026-04-29",
          type: "10-Q",
        },
      ],
      derived_from: ["structured-intelligence", "filing-metadata"],
      model_version: `model-v${version}`,
      prompt_version: "none",
    },
  };
}
