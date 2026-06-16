# 071-database-schema.md

Version: 1.0
Status: LOCKED

Purpose:

Define the logical database schema for the Investment Intelligence Platform.

This specification defines:

- Tables
- Primary Keys
- Versioning
- Relationships
- Indexing Strategy

---

# Architectural Principle

Database stores:

Artifacts

Registries

Governance Decisions

Dependency State

Evaluation Results

Operational State

---

# Storage Domains

The database is divided into:

```text
Artifact Domain

Registry Domain

Governance Domain

Dependency Domain

Evaluation Domain

Operational Domain
```

---

# ARTIFACT DOMAIN

---

# Table

artifact_store

Purpose:

Immutable artifact history.

---

Schema

```sql
artifact_store

id UUID PK

artifact_id VARCHAR

artifact_type VARCHAR

company_id VARCHAR

period_id VARCHAR

version INTEGER

status VARCHAR

content JSONB

metadata JSONB

lineage JSONB

output_content_hash VARCHAR

input_hash VARCHAR

created_at TIMESTAMP
```

---

Indexes

```sql
(company_id, period_id, artifact_type)

artifact_id

output_content_hash
```

---

Rules

Immutable.

Never updated.

Never deleted.

---

# Table

artifact_current_pointer

Purpose:

Resolve current artifact.

---

Schema

```sql
artifact_current_pointer

artifact_type VARCHAR

company_id VARCHAR

period_id VARCHAR

current_artifact_id VARCHAR

current_version INTEGER

updated_at TIMESTAMP
```

---

Primary Key

```sql
(company_id, period_id, artifact_type)
```

---

Rule

Current state lives here.

Not in artifact_store.

---

# DEPENDENCY DOMAIN

---

# Table

dependency_nodes

Purpose:

Operational truth.

---

Schema

```sql
dependency_nodes

node_id UUID

artifact_type VARCHAR

company_id VARCHAR

period_id VARCHAR

current_artifact_id VARCHAR

status VARCHAR

current_version INTEGER

output_content_hash VARCHAR

updated_at TIMESTAMP
```

---

Statuses

```text
current

candidate_stale

stale

pending_regeneration
```

---

# Table

dependency_edges

Purpose:

Dependency graph.

---

Schema

```sql
dependency_edges

id UUID

upstream_type VARCHAR

downstream_type VARCHAR

created_at TIMESTAMP
```

---

Examples

```text
Themes
→ Topic Assignment

Structured Intelligence
→ Company Knowledge

Quarter Understanding
→ Investor Intelligence
```

---

# REGISTRY DOMAIN

---

# Table

prompt_registry

---

Schema

```sql
prompt_registry

id UUID

prompt_id VARCHAR

layer VARCHAR

version VARCHAR

status VARCHAR

prompt_text TEXT

evaluation_version VARCHAR

created_at TIMESTAMP
```

---

Statuses

```text
draft

review

approved

active

deprecated
```

---

# Table

concept_registry

---

Schema

```sql
concept_registry

id UUID

concept_id VARCHAR

topic_ref VARCHAR

status VARCHAR

canonical_definition TEXT

display JSONB

relationships JSONB

registry_version INTEGER

created_at TIMESTAMP
```

---

# Table

topic_registry

---

Schema

```sql
topic_registry

id UUID

topic_id VARCHAR

name VARCHAR

status VARCHAR

registry_version INTEGER

created_at TIMESTAMP
```

---

# GOVERNANCE DOMAIN

---

# Table

governance_decisions

---

Schema

```sql
governance_decisions

id UUID

decision_type VARCHAR

entity_type VARCHAR

entity_id VARCHAR

decision VARCHAR

reviewer VARCHAR

rationale TEXT

created_at TIMESTAMP
```

---

Examples

```text
Prompt Approval

Concept Approval

Knowledge Promotion

Concept Merge
```

---

# Table

knowledge_promotion_queue

---

Schema

```sql
knowledge_promotion_queue

id UUID

company_id VARCHAR

proposal_payload JSONB

status VARCHAR

reviewer VARCHAR

created_at TIMESTAMP
```

---

# EVALUATION DOMAIN

---

# Table

evaluation_results

---

Schema

```sql
evaluation_results

id UUID

artifact_id VARCHAR

artifact_type VARCHAR

evaluation_version VARCHAR

scores JSONB

created_at TIMESTAMP
```

---

# Table

ground_truth_corpus

---

Schema

```sql
ground_truth_corpus

id UUID

company_id VARCHAR

period_id VARCHAR

corpus_payload JSONB

created_at TIMESTAMP
```

---

# Table

calibration_results

---

Schema

```sql
calibration_results

id UUID

layer VARCHAR

metric VARCHAR

calibration_payload JSONB

created_at TIMESTAMP
```

---

# OPERATIONAL DOMAIN

---

# Table

processing_jobs

---

Schema

```sql
processing_jobs

job_id UUID

job_type VARCHAR

builder_type VARCHAR

status VARCHAR

attempts INTEGER

priority VARCHAR

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# Table

execution_logs

---

Schema

```sql
execution_logs

execution_id UUID

job_id UUID

builder_type VARCHAR

status VARCHAR

duration_ms INTEGER

created_at TIMESTAMP
```

---

# Table

event_store

---

Schema

```sql
event_store

event_id UUID

event_type VARCHAR

event_version VARCHAR

correlation_id VARCHAR

causation_id VARCHAR

payload JSONB

created_at TIMESTAMP
```

---

# OBSERVABILITY DOMAIN

---

# Table

audit_events

---

Schema

```sql
audit_events

audit_id UUID

actor VARCHAR

action VARCHAR

entity_type VARCHAR

entity_id VARCHAR

payload JSONB

created_at TIMESTAMP
```

---

# Table

system_metrics

---

Schema

```sql
system_metrics

metric_id UUID

metric_type VARCHAR

metric_payload JSONB

created_at TIMESTAMP
```

---

# Indexing Strategy

Critical indexes:

```sql
artifact_store

(company_id, period_id)

(company_id, period_id, artifact_type)

artifact_id

created_at
```

---

```sql
dependency_nodes

(company_id, period_id)

status
```

---

```sql
processing_jobs

status

priority

created_at
```

---

```sql
event_store

correlation_id

event_type

created_at
```

---

# Partitioning Strategy

artifact_store

Partition By:

```text
company_id
```

initially.

Future:

```text
company_id + year
```

---

event_store

Partition By:

```text
month
```

---

execution_logs

Partition By:

```text
month
```

---

# Architectural Invariants

LOCKED.

1. artifact_store is immutable.
2. Current state resolved through pointers.
3. Dependency Index is operational truth.
4. Event Store is separate from Artifact Store.
5. Governance decisions are permanent.
6. Registries are versioned.
7. Evaluation results are immutable.
8. Audit events are permanent.
9. Operational tables never contain intelligence.
10. Replayability is supported by stored lineage and version history.

End of Specification.