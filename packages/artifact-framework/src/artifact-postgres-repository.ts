import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactLineage } from "../../../contracts/artifacts/artifact-lineage.js";
import type { ArtifactMetadata } from "../../../contracts/artifacts/artifact-metadata.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type { ArtifactRepository } from "./artifact-repository.js";
import type { ArtifactLookup } from "./artifact-types.js";

export type PostgresQueryResult<Row> = {
  rows: Row[];
};

export type PostgresQueryClient = {
  query<Row = unknown>(sql: string, params?: unknown[]): Promise<PostgresQueryResult<Row>>;
};

type ArtifactStoreRow = {
  artifact_id: string;
  artifact_type: ArtifactType;
  company_id: string | null;
  period_id: string | null;
  version: number;
  content: unknown;
  metadata: ArtifactMetadata;
  lineage: ArtifactLineage;
  created_at: Date | string;
  evaluation?: unknown;
  governance?: unknown;
};

export class ArtifactPostgresRepository implements ArtifactRepository {
  constructor(private readonly client: PostgresQueryClient) {}

  async create<T>(artifact: Artifact<T>): Promise<void> {
    await this.client.query("BEGIN");

    try {
      await this.client.query(
        `INSERT INTO artifact_store (
          id,
          artifact_id,
          artifact_type,
          company_id,
          period_id,
          version,
          status,
          content,
          metadata,
          lineage,
          output_content_hash,
          input_hash,
          created_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12
        )`,
        [
          artifact.identity.artifact_id,
          artifact.identity.artifact_type,
          artifact.identity.company_id,
          artifact.identity.period_id,
          artifact.identity.version,
          artifact.metadata.status,
          JSON.stringify(artifact.content),
          JSON.stringify({
            ...artifact.metadata,
            evaluation: artifact.evaluation,
            governance: artifact.governance,
          }),
          JSON.stringify(artifact.lineage),
          artifact.metadata.artifact_hash,
          artifact.metadata.input_hash,
          artifact.metadata.generated_at,
        ],
      );

      await this.client.query(
        `INSERT INTO artifact_current_pointer (
          artifact_type,
          company_id,
          period_id,
          current_artifact_id,
          current_version,
          updated_at
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
        ON CONFLICT (company_id, period_id, artifact_type)
        DO UPDATE SET
          current_artifact_id = EXCLUDED.current_artifact_id,
          current_version = EXCLUDED.current_version,
          updated_at = EXCLUDED.updated_at`,
        [
          artifact.identity.artifact_type,
          artifact.identity.company_id,
          artifact.identity.period_id,
          artifact.identity.artifact_id,
          artifact.identity.version,
          artifact.metadata.generated_at,
        ],
      );

      await this.client.query("COMMIT");
    } catch (error) {
      await this.client.query("ROLLBACK");
      throw new Error(`Failed to create artifact ${artifact.identity.artifact_id}: ${errorMessage(error)}`);
    }
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const result = await this.client.query<ArtifactStoreRow>(
      `SELECT
        artifact_id,
        artifact_type,
        company_id,
        period_id,
        version,
        content,
        metadata,
        lineage,
        created_at
      FROM artifact_store
      WHERE artifact_id = $1
      LIMIT 1`,
      [artifactId],
    );

    return result.rows[0] ? artifactFromRow<T>(result.rows[0]) : null;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const result = await this.client.query<ArtifactStoreRow>(
      `SELECT
        store.artifact_id,
        store.artifact_type,
        store.company_id,
        store.period_id,
        store.version,
        store.content,
        store.metadata,
        store.lineage,
        store.created_at
      FROM artifact_current_pointer pointer
      INNER JOIN artifact_store store
        ON store.artifact_id = pointer.current_artifact_id
      WHERE pointer.artifact_type = $1
        AND pointer.company_id IS NOT DISTINCT FROM $2
        AND pointer.period_id IS NOT DISTINCT FROM $3
      LIMIT 1`,
      [lookup.artifact_type, lookup.company_id, lookup.period_id],
    );

    return result.rows[0] ? artifactFromRow<T>(result.rows[0]) : null;
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    const result = await this.client.query<ArtifactStoreRow>(
      `SELECT
        artifact_id,
        artifact_type,
        company_id,
        period_id,
        version,
        content,
        metadata,
        lineage,
        created_at
      FROM artifact_store
      WHERE artifact_type = $1
        AND company_id IS NOT DISTINCT FROM $2
        AND period_id IS NOT DISTINCT FROM $3
      ORDER BY version ASC`,
      [lookup.artifact_type, lookup.company_id, lookup.period_id],
    );

    return result.rows.map((row) => artifactFromRow<T>(row));
  }
}

function artifactFromRow<T>(row: ArtifactStoreRow): Artifact<T> {
  const metadata = row.metadata as ArtifactMetadata & {
    evaluation?: Artifact<T>["evaluation"];
    governance?: Artifact<T>["governance"];
  };
  const { evaluation, governance, ...artifactMetadata } = metadata;

  return {
    identity: {
      artifact_id: row.artifact_id,
      artifact_type: row.artifact_type,
      company_id: row.company_id,
      period_id: row.period_id,
      version: row.version,
    },
    metadata: artifactMetadata,
    lineage: row.lineage,
    content: row.content as T,
    evaluation,
    governance,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

