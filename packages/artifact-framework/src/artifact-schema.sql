CREATE TABLE IF NOT EXISTS artifact_store (
  id UUID PRIMARY KEY,
  artifact_id VARCHAR NOT NULL UNIQUE,
  artifact_type VARCHAR NOT NULL,
  company_id VARCHAR,
  period_id VARCHAR,
  version INTEGER NOT NULL,
  status VARCHAR NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB NOT NULL,
  lineage JSONB NOT NULL,
  output_content_hash VARCHAR NOT NULL,
  input_hash VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS artifact_store_company_period_idx
  ON artifact_store (company_id, period_id);

CREATE INDEX IF NOT EXISTS artifact_store_company_period_type_idx
  ON artifact_store (company_id, period_id, artifact_type);

CREATE INDEX IF NOT EXISTS artifact_store_artifact_id_idx
  ON artifact_store (artifact_id);

CREATE INDEX IF NOT EXISTS artifact_store_created_at_idx
  ON artifact_store (created_at);

CREATE INDEX IF NOT EXISTS artifact_store_output_content_hash_idx
  ON artifact_store (output_content_hash);

CREATE TABLE IF NOT EXISTS artifact_current_pointer (
  artifact_type VARCHAR NOT NULL,
  company_id VARCHAR,
  period_id VARCHAR,
  current_artifact_id VARCHAR NOT NULL,
  current_version INTEGER NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  PRIMARY KEY (company_id, period_id, artifact_type)
);

