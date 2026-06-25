# Prompt Registry Contract

Status: LOCKED

# 1. Purpose

The Prompt Registry governs every LLM prompt used by the platform.

It is the single source of truth for:

- Prompt identity
- Prompt versioning
- Prompt activation
- Prompt lifecycle
- Prompt lineage
- Prompt reproducibility
- Model binding
- Prompt rollback

The Prompt Registry does not execute prompts.

It governs them.

---

# 2. Why This Exists

Every LLM artifact depends on a prompt.

Changing a prompt changes platform behavior.

Without governance:

- outputs become unreproducible
- historical artifacts cannot be recreated
- regressions become invisible
- prompt drift accumulates
- auditability is lost

The Prompt Registry exists to prevent this.

---

# 3. Scope

The Prompt Registry governs every LLM layer.

Current platform prompts include:

- Themes
- Structured Intelligence
- Quarter Understanding
- Investor Intelligence

Future LLM layers must also register here.

No LLM prompt may exist outside the Prompt Registry.

---

# 4. Ownership

Prompt Registry owns

- prompt identity
- prompt version
- activation status
- lifecycle state
- model binding
- rendering functions
- prompt metadata
- rollback history

Prompt Registry does NOT own

- builder execution
- artifact generation
- evaluation
- business logic
- model execution

---

# 5. Golden Rules

## Rule 1

Every prompt has exactly one identity.

Example

```
theme-generation
```

not

```
theme-prompt-v8
```

Identity never changes.

---

## Rule 2

Prompt versions are immutable.

A published version is never edited.

Changes always create a new version.

---

## Rule 3

Only one version is ACTIVE.

Previous versions remain archived.

---

## Rule 4

Historical artifacts always record
the exact prompt version used.

Artifacts never reference "latest".

---

## Rule 5

Prompt activation is governed.

Creating a prompt version does not activate it.

---

## Rule 6

Prompt execution never decides prompt selection.

Builders request

```
Prompt Identity
```

Registry returns

```
Active Version
```

Builders never hardcode versions.

---

# 6. Prompt Lifecycle

Every prompt follows

```
Draft

↓

Candidate

↓

Validated

↓

Active

↓

Deprecated

↓

Archived
```

---

## Draft

Work in progress.

Not executable.

---

## Candidate

Ready for evaluation.

Not yet deployable.

---

## Validated

Evaluation completed.

Eligible for activation.

Still inactive.

---

## Active

Current production prompt.

Exactly one active version exists.

---

## Deprecated

Replaced by newer version.

Still reproducible.

Still executable for replay.

---

## Archived

Never used again.

Retained only for audit.

---

# 7. Prompt Identity

Every prompt owns

```
Prompt ID
```

Example

```
theme-generation
```

```
structured-intelligence
```

```
quarter-understanding
```

```
investor-intelligence
```

Prompt IDs never change.

---

# 8. Prompt Version

Every change creates

```
v1

v2

v3

...
```

Versions are immutable.

Version numbers never decrease.

---

# 9. Model Binding

Every prompt version records
the model it was validated against.

Example

```
Prompt

theme-generation-v6

↓

Validated Model

GPT-5.5
```

Changing models does not silently
reuse validation.

Running

```
Prompt v6

↓

Different Model
```

must record

```
Model mismatch
```

inside artifact lineage.

---

# 10. Activation

Activation is controlled
by the Prompt Registry.

Builders never activate prompts.

Activation requires

- candidate exists
- validation completed
- evaluation passed
- approval recorded

Only then

```
ACTIVE
```

is updated.

---

# 11. Rollback

Rollback changes

```
ACTIVE VERSION
```

only.

Rollback never edits prompts.

Example

```
v6

↓

rollback

↓

v5 active
```

History remains intact.

---

# 12. Prompt Rendering

Registry owns rendering.

Prompt files expose

```
System Prompt

User Prompt Renderer
```

Builders provide

```
context
```

Registry returns

```
fully rendered prompt
```

Builders never concatenate prompts.

---

# 13. Artifact Lineage

Every LLM artifact records

```
prompt_id

prompt_version

model_name

model_version

render_hash

execution_time

created_at
```

This guarantees reproducibility.

---

# 14. Prompt Hash

Rendered prompts produce

```
prompt_hash
```

Hash includes

- system prompt
- rendered user prompt
- injected instructions

Two executions with different hashes
are different executions.

---

# 15. Prompt Registry Schema

Each registered prompt records

```
Prompt ID

Version

Lifecycle State

Description

Owning Layer

Owning Builder

Model Binding

Created By

Created At

Activated At

Deprecated At

Prompt Hash

Render Function

System Prompt Location

User Prompt Renderer
```

---

# 16. Forbidden Behaviour

Builders must never

- embed prompt text
- embed prompt versions
- bypass registry
- concatenate prompts manually
- activate prompts
- deactivate prompts
- modify prompt metadata

---

# 17. Relationship To Builders

Builders request

```
Prompt Identity
```

Registry returns

```
Active Prompt Version
```

Builders execute only what the registry provides.

Builders are prompt consumers.

Prompt Registry is prompt authority.

---

# 18. Relationship To Prompt Contracts

Prompt Registry governs

HOW prompts live.

Prompt Contracts govern

WHAT prompts are allowed to do.

Example

Prompt Registry

- versioning
- activation
- rollback
- lineage

Prompt Contract

- allowed reasoning
- forbidden reasoning
- required outputs
- ownership boundaries

These are separate responsibilities.

---

# 19. Relationship To Evaluation

Evaluation does not activate prompts.

Evaluation measures prompt quality.

Prompt Registry decides
whether evaluation results satisfy
activation requirements.

Evaluation produces evidence.

Registry owns activation.

---

# 20. Relationship To Architecture

Prompt Registry is infrastructure.

It is not an intelligence layer.

It produces no business intelligence.

It owns no ownership questions.

It produces no artifacts for investors.

Its only responsibility is
governing prompts.

---

# 21. Future Compatibility

Every future LLM layer must register here.

Examples

- Company Research
- Market Intelligence
- Earnings Call Analysis
- News Intelligence

No prompt may bypass this registry.

This document is the canonical governance contract for prompt lifecycle management across the platform.