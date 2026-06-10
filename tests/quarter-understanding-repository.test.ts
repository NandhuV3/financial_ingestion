import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FileQuarterUnderstandingRepository } from "../src/quarter-understanding-intelligence/quarter-understanding.repository.js";
import type { QuarterUnderstandingArtifact } from "../src/quarter-understanding-intelligence/types/quarter-understanding.types.js";

describe("quarter understanding repository", () => {
  it("saves current and archive versions", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileQuarterUnderstandingRepository(root);
    const first = artifact("2026-Q1", 1, "hash-1");
    const second = artifact("2026-Q1", 2, "hash-2");

    await repository.save("msft", "2026-Q1", first);
    await repository.save("MSFT", "2026-Q1", second);

    assert.deepEqual(await repository.loadCurrent("MSFT", "2026-Q1"), second);
    assert.deepEqual(await repository.loadVersion("MSFT", "2026-Q1", 1), first);
    assert.deepEqual(await repository.loadVersion("MSFT", "2026-Q1", 2), second);
    assert.deepEqual(await repository.listVersions("MSFT", "2026-Q1"), [1, 2]);
  });

  it("returns null for missing current and historical versions", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileQuarterUnderstandingRepository(root);

    assert.equal(await repository.loadCurrent("MSFT", "2026-Q1"), null);
    assert.equal(await repository.loadVersion("MSFT", "2026-Q1", 1), null);
    assert.equal(await repository.exists("MSFT", "2026-Q1"), false);
    assert.deepEqual(await repository.listVersions("MSFT", "2026-Q1"), []);
  });

  it("reports existence from current.json only", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileQuarterUnderstandingRepository(root);

    await repository.save("MSFT", "2026-Q1", artifact("2026-Q1", 1, "hash-1"));

    assert.equal(await repository.exists("MSFT", "2026-Q1"), true);
    assert.equal(await repository.exists("MSFT", "2026-Q2"), false);
  });

  it("lists numeric archive versions oldest to newest and ignores non-version files", async () => {
    const root = await createWarehouseRoot();
    const archiveDirectory = join(root, "companies", "MSFT", "quarter-understanding", "2026-Q1", "archive");
    const repository = new FileQuarterUnderstandingRepository(root);

    await mkdir(archiveDirectory, { recursive: true });
    await writeFile(join(archiveDirectory, "10.json"), "{}\n", "utf8");
    await writeFile(join(archiveDirectory, "2.json"), "{}\n", "utf8");
    await writeFile(join(archiveDirectory, "notes.txt"), "ignore\n", "utf8");

    assert.deepEqual(await repository.listVersions("MSFT", "2026-Q1"), [2, 10]);
  });

  it("throws a descriptive error for invalid JSON", async () => {
    const root = await createWarehouseRoot();
    const currentDirectory = join(root, "companies", "MSFT", "quarter-understanding", "2026-Q1");
    const repository = new FileQuarterUnderstandingRepository(root);

    await mkdir(currentDirectory, { recursive: true });
    await writeFile(join(currentDirectory, "current.json"), "{bad json", "utf8");

    await assert.rejects(
      () => repository.loadCurrent("MSFT", "2026-Q1"),
      /Invalid Quarter Understanding JSON/,
    );
  });

  it("preserves artifact metadata, lineage, confidence, business key, and evidence exactly", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileQuarterUnderstandingRepository(root);
    const source = artifact("2026-Q1", 7, "original-hash");

    await repository.save("MSFT", "2026-Q1", source);

    const loaded = await repository.loadCurrent("MSFT", "2026-Q1");

    assert.deepEqual(loaded, source);
    assert.equal(loaded?.metadata.understanding_version, 7);
    assert.equal(loaded?.metadata.input_hash, "original-hash");
    assert.deepEqual(loaded?.understandings[0]?.business_key, source.understandings[0]?.business_key);
    assert.deepEqual(loaded?.understandings[0]?.confidence, source.understandings[0]?.confidence);
    assert.deepEqual(loaded?.understandings[0]?.evidence, source.understandings[0]?.evidence);
    assert.deepEqual(loaded?.lineage, source.lineage);
  });

  it("isolates storage by reporting period", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileQuarterUnderstandingRepository(root);
    const q1 = artifact("2026-Q1", 1, "hash-q1");
    const q2 = artifact("2026-Q2", 1, "hash-q2");

    await repository.save("MSFT", "2026-Q1", q1);
    await repository.save("MSFT", "2026-Q2", q2);

    assert.deepEqual(await repository.loadCurrent("MSFT", "2026-Q1"), q1);
    assert.deepEqual(await repository.loadCurrent("MSFT", "2026-Q2"), q2);
    assert.deepEqual(await repository.loadVersion("MSFT", "2026-Q1", 1), q1);
    assert.deepEqual(await repository.loadVersion("MSFT", "2026-Q2", 1), q2);
    assert.deepEqual(await repository.listVersions("MSFT", "2026-Q1"), [1]);
    assert.deepEqual(await repository.listVersions("MSFT", "2026-Q2"), [1]);
  });
});

async function createWarehouseRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), "quarter-understanding-repository-"));
}

function artifact(period: string, version: number, inputHash: string): QuarterUnderstandingArtifact {
  return {
    company: "Microsoft",
    period,
    understandings: [
      {
        understanding_id: "understanding_cloud",
        semantic_anchor_key: "cloud_demand",
        business_key: {
          company: "Microsoft",
          category: "revenue",
          topic: "cloud_demand",
        },
        category: "revenue",
        summary: "Cloud demand remains important.",
        importance: "high",
        confidence: {
          score: 0.9,
          evidence_count: 3,
          source_reliability: "high",
          signal_agreement: "corroborating",
          company_knowledge_alignment: "consistent",
        },
        evidence: {
          signal_refs: [
            {
              signal_id: "signal_revenue",
              period,
              artifact_path: `business-signals/${period}/current.json`,
              input_hash: "signal-hash",
            },
          ],
          company_knowledge_ref: {
            artifact_path: "company-knowledge/current.json",
            version: 2,
            input_hash: "knowledge-hash",
          },
          evidence_context: "Revenue driver observed: cloud subscriptions",
        },
      },
    ],
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "quarter-understanding-builder-v1",
      model_version: "deterministic-builder-v1",
      prompt_version: "none",
      generated_at: "2026-06-08T00:00:00.000Z",
      understanding_version: version,
      input_hash: inputHash,
    },
    lineage: {
      derived_from: [
        {
          path: `business-signals/${period}/current.json`,
          version: 1,
          input_hash: "signal-hash",
        },
      ],
      source_filings: [
        {
          id: "0000000000-00-000000",
          period,
          type: "10-Q",
        },
      ],
    },
  };
}
