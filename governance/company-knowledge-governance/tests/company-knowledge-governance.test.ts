import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PROMOTION_RULES_VERSION } from "../promotion-rules.js";
import {
  candidateArtifact,
  candidateWithConfidenceRegression,
  candidateWithCustomerMerge,
  candidateWithStableFieldChange,
  companyKnowledgeArtifact,
  firstPopulationCandidate,
  governanceHarness,
  knowledge,
} from "./company-knowledge-governance.fixtures.js";

describe("company knowledge governance engine", () => {
  it("persists GovernanceDecision and approved Company Knowledge through Artifact Framework", async () => {
    const harness = governanceHarness();
    const result = await harness.engine.execute({
      company_id: "MSFT",
      period_id: "2026-Q2",
      candidate_artifact: candidateArtifact(firstPopulationCandidate()),
      current_company_knowledge: null,
      promotion_rules_version: PROMOTION_RULES_VERSION,
      reviewer: null,
      manual_override: null,
      generated_at: harness.clock.now(),
    });

    assert.equal(result.governance_decision.identity.artifact_type, "governance_decision");
    assert.equal(result.company_knowledge?.identity.artifact_type, "company_knowledge");
    assert.equal(
      result.governance_decision.content.resulting_company_knowledge_artifact_id,
      result.company_knowledge?.identity.artifact_id,
    );
    assert.equal(result.company_knowledge?.content.company_knowledge_version, 1);
    assert.equal(result.review_queue_entries.length, 0);
    assert.equal(harness.invalidation.events.length, 1);
    assert.deepEqual(await harness.repository.getCurrent({
      artifact_type: "company_knowledge",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), result.company_knowledge);
  });

  it("creates review queue entries for stable field changes and does not expose them downstream", async () => {
    const harness = governanceHarness();
    const result = await harness.engine.execute({
      company_id: "MSFT",
      period_id: "2026-Q2",
      candidate_artifact: candidateArtifact(candidateWithStableFieldChange()),
      current_company_knowledge: companyKnowledgeArtifact(knowledge()),
      promotion_rules_version: PROMOTION_RULES_VERSION,
      reviewer: null,
      manual_override: null,
      generated_at: harness.clock.now(),
    });

    assert.equal(result.review_queue_entries.length, 1);
    assert.equal(result.review_queue_entries[0]?.status, "pending");
    assert.equal(result.review_queue_entries[0]?.trigger, "stable_field_change");
    assert.equal(result.company_knowledge, null);
    assert.equal(result.audit_entry.event_type, "review");
    assert.deepEqual(await harness.reviewQueue.findByStatus("pending"), result.review_queue_entries);
  });

  it("appends CompanyKnowledgeAuditEntry operational records", async () => {
    const harness = governanceHarness();
    const candidate = candidateArtifact(firstPopulationCandidate());

    const result = await harness.engine.execute({
      company_id: "MSFT",
      period_id: "2026-Q2",
      candidate_artifact: candidate,
      current_company_knowledge: null,
      promotion_rules_version: PROMOTION_RULES_VERSION,
      reviewer: null,
      manual_override: null,
      generated_at: harness.clock.now(),
    });
    const entries = await harness.audit.findByCandidate(candidate.identity.artifact_id);

    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.candidate_artifact_id, candidate.identity.artifact_id);
    assert.equal(entries[0]?.governance_decision_artifact_id, result.governance_decision.identity.artifact_id);
    assert.equal(entries[0]?.after_company_knowledge_artifact_id, result.company_knowledge?.identity.artifact_id);
    assert.equal(entries[0]?.event_type, "promotion");
  });

  it("retains on confidence regression without creating Company Knowledge or invalidation", async () => {
    const harness = governanceHarness();
    const result = await harness.engine.execute({
      company_id: "MSFT",
      period_id: "2026-Q2",
      candidate_artifact: candidateArtifact(candidateWithConfidenceRegression()),
      current_company_knowledge: companyKnowledgeArtifact(knowledge()),
      promotion_rules_version: PROMOTION_RULES_VERSION,
      reviewer: null,
      manual_override: null,
      generated_at: harness.clock.now(),
    });

    assert.equal(result.governance_decision.content.decisions[0]?.outcome, "retain");
    assert.equal(result.audit_entry.event_type, "retain");
    assert.equal(result.company_knowledge, null);
    assert.equal(harness.invalidation.events.length, 0);
  });

  it("merges additive semi-stable updates into a new Company Knowledge artifact", async () => {
    const harness = governanceHarness();
    const result = await harness.engine.execute({
      company_id: "MSFT",
      period_id: "2026-Q2",
      candidate_artifact: candidateArtifact(candidateWithCustomerMerge()),
      current_company_knowledge: companyKnowledgeArtifact(knowledge()),
      promotion_rules_version: PROMOTION_RULES_VERSION,
      reviewer: null,
      manual_override: null,
      generated_at: harness.clock.now(),
    });

    assert.equal(result.governance_decision.content.decisions[0]?.outcome, "merge");
    assert.equal(result.audit_entry.event_type, "merge");
    assert.equal(result.company_knowledge?.content.knowledge.customers.length, 2);
    assert.equal(result.company_knowledge?.lineage.upstream_dependencies.some((dependency) =>
      dependency.artifact_type === "governance_decision"), true);
  });

  it("rolls back by creating a new Company Knowledge version through Artifact Framework", async () => {
    const harness = governanceHarness();
    const target = companyKnowledgeArtifact(knowledge(), {
      artifactId: "company-knowledge-v1",
      version: 1,
      companyKnowledgeVersion: 1,
    });
    const currentKnowledge = {
      ...knowledge(),
      products: [
        {
          product_name: "Experimental Product",
          description: "Temporary product narrative.",
          confidence: 0.7,
          supporting_periods: ["2026-Q2"],
          last_updated_period: "2026-Q2",
        },
      ],
    };
    const current = companyKnowledgeArtifact(currentKnowledge, {
      artifactId: "company-knowledge-v2",
      version: 2,
      companyKnowledgeVersion: 2,
    });
    await harness.repository.create(target);
    await harness.repository.create(current);

    const result = await harness.engine.rollback({
      company_id: "MSFT",
      period_id: "2026-Q2",
      target_version: 1,
      reviewer: "governance-reviewer",
      reason: "Restore prior approved knowledge.",
      generated_at: harness.clock.now(),
    });

    assert.equal(result.governance_decision.content.governance_action, "rollback");
    assert.equal(result.governance_decision.content.rollback_target_artifact_id, target.identity.artifact_id);
    assert.equal(
      result.governance_decision.content.resulting_company_knowledge_artifact_id,
      result.company_knowledge.identity.artifact_id,
    );
    assert.equal(result.company_knowledge.identity.version, 3);
    assert.equal(result.company_knowledge.content.company_knowledge_version, 3);
    assert.deepEqual(result.company_knowledge.content.knowledge.products, target.content.knowledge.products);
    assert.equal(result.audit_entry.event_type, "rollback");
    assert.equal(result.invalidation_event.source_artifact_id, result.company_knowledge.identity.artifact_id);
    assert.equal(harness.invalidation.events.length, 1);
  });
});
