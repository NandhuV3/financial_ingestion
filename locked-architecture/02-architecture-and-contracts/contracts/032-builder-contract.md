# Builder Contract

Status: LOCKED

# 1. Purpose

This document defines the standard execution contract for every Builder in the platform.

Builders transform upstream artifacts into new downstream artifacts.

Every builder follows the same execution lifecycle, validation rules, retry policy, lineage generation, artifact writing sequence, and failure behavior.

No builder may define its own execution lifecycle.

---

# 2. Why This Exists

Without a shared Builder Contract:

- builders retry differently
- validation becomes inconsistent
- lineage becomes incomplete
- artifact writing order differs
- failures become unpredictable
- operational behavior diverges

This contract prevents builder drift across the platform.

---

# 3. Scope

This contract applies to every builder.

Current builders include

- Themes Builder
- Topic Assignment Builder
- Topic Evolution Builder
- Structured Intelligence Builder
- Company Knowledge Candidate Builder
- Quarter Change Builder
- Business Signals Builder
- Commitment Tracking Builder
- Narrative Consistency Builder
- Accounting Stability Builder
- Capital Allocation Tracking Builder
- Trust Signals Builder
- Quarter Understanding Builder
- Investor Intelligence Builder

Future builders automatically inherit this contract.

---

# 4. Builder Responsibilities

Every builder owns exactly one responsibility.

```
Read upstream artifacts

↓

Validate inputs

↓

Execute transformation

↓

Validate output

↓

Generate lineage

↓

Write artifact

↓

Report execution
```

Builders never perform responsibilities owned by governance.

Builders never mutate upstream artifacts.

Builders never bypass the Artifact Framework.

---

# 5. Golden Rules

## Rule 1

One Builder produces one artifact type.

Never multiple artifact types.

---

## Rule 2

Builders are stateless.

All required state must come from upstream artifacts.

Builders never maintain hidden memory.

---

## Rule 3

Builders never modify existing artifacts.

Builders always create new artifact versions.

---

## Rule 4

Builders never skip validation.

Input validation always precedes execution.

Output validation always precedes writing.

---

## Rule 5

Builders never write invalid artifacts.

Validation failure prevents writing.

---

## Rule 6

Builders never partially overwrite artifacts.

Artifact writes are atomic.

---

# 6. Standard Execution Lifecycle

Every builder executes exactly this sequence.

```
Resolve Dependencies

↓

Load Inputs

↓

Validate Inputs

↓

Prepare Context

↓

Execute

↓

Parse Output

↓

Validate Output

↓

Generate Metadata

↓

Generate Lineage

↓

Write Artifact

↓

Publish Result
```

No steps may be omitted.

---

# 7. Dependency Resolution

Builders resolve every required dependency before execution.

Required dependencies

- must exist
- must be active
- must pass validation

Optional enrichment inputs

- may be absent
- must record enrichment status

Builders never fabricate missing dependencies.

---

# 8. Input Validation

Builders validate

- schema version
- artifact version
- artifact status
- required fields
- lineage integrity
- hash integrity

Invalid inputs stop execution.

Builders never repair upstream artifacts.

---

# 9. Context Preparation

Builders prepare execution context.

Examples

LLM Builders

- render prompts
- collect evidence
- build context

Deterministic Builders

- organize inputs
- build lookup maps
- prepare comparison structures

Context preparation never changes business meaning.

---

# 10. Execution

Builders execute exactly one transformation.

Examples

Themes Builder

```
Evidence

↓

Themes
```

Quarter Change Builder

```
Previous SI

+

Current SI

↓

Business Delta
```

Business Signals Builder

```
CK

+

QC

+

TE

↓

Signals
```

Builders never perform multiple unrelated transformations.

---

# 11. Parsing Policy

Applicable only to LLM Builders.

LLM output must

- parse successfully
- satisfy schema
- satisfy ownership boundaries

Malformed output is never accepted.

Builders never silently repair malformed LLM output.

---

# 12. Retry Policy

Retries apply only to retryable failures.

Retryable examples

- transient API failure
- timeout
- rate limit

Non-retryable examples

- invalid schema
- invalid JSON
- ownership violation
- validation failure

Retry policy is platform-wide.

Builders never define custom retry counts.

---

# 13. Output Validation

Every artifact must pass

Schema Validation

↓

Ownership Validation

↓

Reference Validation

↓

Artifact Validation

↓

Business Rule Validation

before writing.

Validation failures stop execution.

---

# 14. Ownership Validation

Builders verify

- no forbidden fields
- no downstream reasoning
- no ownership violations
- no missing required fields

LLM builders must validate prompt boundaries.

Example

Themes Builder must reject

Investor conclusions.

Structured Intelligence Builder must reject

Trust assessments.

Quarter Understanding Builder must reject

Ownership conclusions.

---

# 15. Metadata Generation

Builders generate

- artifact version
- timestamps
- hashes
- pipeline version
- builder version

Metadata generation is deterministic.

---

# 16. Lineage Generation

Builders provide the lineage inputs required to describe their execution.

Artifact Framework assembles the final artifact lineage.

Builders never construct artifact lineage directly.

Builder responsibilities include providing:

- upstream artifact dependencies
- execution references (when Execution Records are consumed)
- prompt reference (LLM Builders only)
- model reference (LLM Builders and deterministic builders that execute embedding models)
- execution context

Artifact Framework is responsible for:

- assembling the complete lineage object
- validating lineage structure
- attaching lineage to the Platform Artifact

Lineage generation is mandatory.

No persisted Platform Artifact may omit lineage.

---

# 17. Artifact Writing

Builders never write Platform Artifacts directly.

Artifact Framework exclusively owns artifact construction and persistence.

Builders submit a validated **Builder Result**.

The Builder Result contains the execution output produced by the builder.

Artifact Framework transforms the Builder Result into the final persisted Platform Artifact.

```
Builder
↓
Builder Result
↓
Artifact Framework
↓
Artifact Construction
↓
Artifact Storage
```

Builders never construct:
- Platform Artifacts directly
- artifact metadata directly
- artifact lineage directly

Artifact Framework exclusively owns:

- artifact construction
- metadata generation
- lineage assembly
- dependency recording
- execution reference recording
- artifact persistence
- version management
- archive management
- current pointer updates
---

# 18. Failure Behaviour

Builders never fail silently.

Every failure produces

- execution id
- failure stage
- failure reason
- timestamp
- retry status

Failure records are operational artifacts.

---

# 19. Partial Success

Builders either

produce

```
VALID ARTIFACT
```

or

produce

```
FAILURE RECORD
```

Builders never produce partially valid artifacts.

Exception

Platform-defined degraded execution states.

Those must be explicitly defined by platform contracts.

---

# 20. Logging

Builders log

- execution start
- dependency resolution
- validation
- execution
- retries
- artifact write
- completion

Logging never replaces lineage.

---

# 21. LLM Builder Responsibilities

LLM builders additionally perform

- prompt rendering
- prompt validation
- model execution
- response parsing
- ownership validation

LLM builders never own prompt lifecycle.

Prompt Registry owns prompts.

---

# 22. Deterministic Builder Responsibilities

Deterministic builders

- never call LLMs
- never perform interpretation
- never generate narrative text

They transform structured inputs into structured outputs.

---

# 23. Relationship To Prompt Registry

Builders request

Prompt ID

Prompt Registry returns

Active Prompt Version

Builders never know prompt activation.

Builders only execute.

---

# 24. Relationship To Artifact Framework

Builders produce **Builder Results**.

Artifact Framework constructs and stores Platform Artifacts.

Builders own:

- business transformation
- execution logic
- input validation
- output validation
- Builder Result generation

Artifact Framework owns:

- Platform Artifact construction
- metadata generation
- lineage assembly
- dependency recording
- execution reference recording
- artifact validation
- version management
- archive management
- current pointer updates
- artifact persistence

Builders never construct Platform Artifact objects directly.

Builders never bypass Artifact Framework ownership.

---

# 25. Relationship To Governance

Builders propose.

Governance decides.

Example

Company Knowledge Builder

↓

Candidate

↓

Governance Promotion

↓

Company Knowledge

Builders never bypass governance.

---

# 26. Relationship To Layer Ownership

Builders implement layer responsibilities.

They never redefine them.

Ownership specifications remain the source of truth.

---

# 27. Forbidden Behaviour

Builders must never

- modify upstream artifacts
- mutate Company Knowledge
- bypass Prompt Registry
- bypass Artifact Framework
- bypass validation
- invent missing dependencies
- infer historical state
- silently repair invalid outputs
- skip lineage generation
- write directly to storage
- activate prompts
- change governance decisions

---

# 28. Future Compatibility

Every new builder added to the platform must implement this contract.

No builder-specific execution lifecycle may be introduced without updating this specification.

This document is the canonical execution contract for all builders.