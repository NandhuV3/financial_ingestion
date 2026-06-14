import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FileBusinessSignalRepository } from "../src/business-signal-intelligence/business-signal.repository.js";
import type { BusinessSignalArtifact } from "../src/business-signal-intelligence/types/business-signal.types.js";

describe("business signal repository", () => {
  it("saves current and archive versions", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileBusinessSignalRepository(root);
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
    const repository = new FileBusinessSignalRepository(root);

    assert.equal(await repository.loadCurrent("MSFT", "2026-Q1"), null);
    assert.equal(await repository.loadVersion("MSFT", "2026-Q1", 1), null);
    assert.equal(await repository.exists("MSFT", "2026-Q1"), false);
    assert.deepEqual(await repository.listVersions("MSFT", "2026-Q1"), []);
  });

  it("reports existence from current.json only", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileBusinessSignalRepository(root);

    await repository.save("MSFT", "2026-Q1", artifact("2026-Q1", 1, "hash-1"));

    assert.equal(await repository.exists("MSFT", "2026-Q1"), true);
    assert.equal(await repository.exists("MSFT", "2026-Q2"), false);
  });

  it("lists numeric archive versions oldest to newest and ignores non-version files", async () => {
    const root = await createWarehouseRoot();
    const archiveDirectory = join(root, "companies", "MSFT", "business-signals", "2026-Q1", "archive");
    const repository = new FileBusinessSignalRepository(root);

    await mkdir(archiveDirectory, { recursive: true });
    await writeFile(join(archiveDirectory, "10.json"), "{}\n", "utf8");
    await writeFile(join(archiveDirectory, "2.json"), "{}\n", "utf8");
    await writeFile(join(archiveDirectory, "notes.txt"), "ignore\n", "utf8");

    assert.deepEqual(await repository.listVersions("MSFT", "2026-Q1"), [2, 10]);
  });

  it("throws a descriptive error for invalid JSON", async () => {
    const root = await createWarehouseRoot();
    const currentDirectory = join(root, "companies", "MSFT", "business-signals", "2026-Q1");
    const repository = new FileBusinessSignalRepository(root);

    await mkdir(currentDirectory, { recursive: true });
    await writeFile(join(currentDirectory, "current.json"), "{bad json", "utf8");

    await assert.rejects(
      () => repository.loadCurrent("MSFT", "2026-Q1"),
      /Invalid Business Signal JSON/,
    );
  });

  it("persists artifacts exactly without mutating signals, confidence, hash, lineage, or metadata", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileBusinessSignalRepository(root);
    const source = artifact("2026-Q1", 7, "original-hash");

    await repository.save("MSFT", "2026-Q1", source);

    const loaded = await repository.loadCurrent("MSFT", "2026-Q1");

    assert.deepEqual(loaded, source);
    assert.equal(loaded?.metadata.signal_version, 7);
    assert.equal(loaded?.metadata.input_hash, "original-hash");
    assert.equal(loaded?.signals[0]?.confidence, 0.8);
    assert.equal(loaded?.lineage.model_version, "model-v7");
  });

  it("isolates storage by reporting period", async () => {
    const root = await createWarehouseRoot();
    const repository = new FileBusinessSignalRepository(root);
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
  return mkdtemp(join(tmpdir(), "business-signal-repository-"));
}

function artifact(period: string, version: number, inputHash: string): BusinessSignalArtifact {
  return {
    company: "Microsoft",
    period,
    signals: [
      {
        signal_id: "signal_revenue",
        category: "revenue",
        summary: "Revenue driver observed: cloud subscriptions",
        direction: "neutral",
        magnitude: "low",
        confidence: 0.8,
        evidence: [
          {
            evidence_id: "evidence_revenue",
            source: "company-knowledge",
            description: "cloud subscriptions",
          },
        ],
      },
    ],
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "business-signal-builder-v1",
      signal_version: version,
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: inputHash,
    },
    lineage: {
      derived_from: [
        {
          path: "company-knowledge/current.json",
          version: 1,
          input_hash: "knowledge-hash",
        },
      ],
      source_filings: [
        {
          id: "0000000000-00-000000",
          period,
          type: "10-Q",
        },
      ],
      model_version: `model-v${version}`,
      prompt_version: "none",
    },
  };
}
