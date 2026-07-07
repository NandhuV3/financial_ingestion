025 - Topic Evolution Implementation Roadmap

Status: DRAFT → LOCKED after review
Layer: Company Intelligence
Owner: Company Intelligence Architecture

Purpose

This roadmap defines the implementation sequence for Topic Evolution.

It separates architecture, implementation, replay, and downstream integration into independent work orders.

The objective is to produce a deterministic, replayable Company Intelligence artifact before integrating it into downstream layers.

Scope

This roadmap covers only:

Topic Evolution
Topic Evolution replay
Topic Evolution acceptance
Business Signals integration

It does not cover:

Quarter Change
Company Knowledge
Quarter Understanding
Trust Architecture
Investor Intelligence
Architectural Position
Themes
        │
        ▼
Topic Assignment
(Platform Intelligence)
        │
        ▼
Topic Evolution
(Company Intelligence)
        │
        ▼
Business Signals

Platform Intelligence is treated as a closed subsystem.

Topic Evolution consumes only persisted Topic Assignment artifacts.

Guiding Principles

Every work order must preserve:

deterministic execution
replayability
immutable artifacts
clean ownership boundaries
Builder Framework contracts
Artifact Framework contracts

No work order may expand scope beyond its stated responsibility.

Work Order Sequence
WO-TE-001 — Topic Evolution Builder
Objective

Implement the Topic Evolution Builder.

Responsibilities
Consume current Topic Assignment artifact.
Consume historical Topic Assignment artifacts.
Detect longitudinal Topic behavior.
Produce one Topic Evolution Company Intelligence Artifact.
Persist through the Artifact Framework.
Must Not
Consume Topic Signals.
Consume Platform Registry.
Consume Company Knowledge.
Produce Business Signals.
Perform interpretation.
Acceptance
Builder tests pass.
Artifact deterministic.
Typecheck passes.
WO-TE-002 — Standalone Topic Evolution Replay Runner
Objective

Implement deterministic replay.

Responsibilities
Load persisted Topic Assignment artifacts.
Replay Topic Evolution.
Produce identical Topic Evolution artifact.
Must Not
Regenerate Topic Assignments.
Invoke Platform Intelligence.
Modify artifacts.
Acceptance
Standalone replay succeeds.
Replay uses persisted artifacts only.
WO-TE-003 — Deterministic Replay Validation
Objective

Certify replay.

Validation

Verify:

byte-identical JSON
deterministic artifact ID
deterministic artifact hash
deterministic lineage
deterministic metadata
SHA-256 equality
Output

Replay verification report.

WO-TE-004 — Business Signals Integration
Objective

Integrate Topic Evolution into Business Signals.

Responsibilities

Business Signals consumes Topic Evolution as an enrichment input.

Must Not
Change Topic Evolution behavior.
Change Topic Assignment.
Change replay.
Validation

Verify:

enrichment handling
first-period handling
dependency handling
WO-TE-005 — End-to-End Acceptance
Objective

Validate Topic Evolution within Company Intelligence.

Validation

Run:

Topic Assignment
Topic Evolution
Business Signals

Verify:

deterministic execution
replay
artifact lineage
first-period behavior
enrichment status

Produce:

acceptance report
replay report
SHA-256 summary
Implementation Philosophy

Every work order must finish with:

focused tests
replay validation (when applicable)
typecheck
git diff --check

No downstream implementation begins until the current work order is accepted.

Completion Criteria

Topic Evolution is complete when:

deterministic Company Intelligence artifact exists
replay is certified
Business Signals consumes it correctly
end-to-end acceptance passes

Only then may Company Intelligence proceed to the next architectural milestone.