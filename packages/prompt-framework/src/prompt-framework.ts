import type {
  PromptAssembly,
  PromptFramework,
} from "../../../contracts/execution/prompt-framework-contract.js";
import type {
  PromptAssemblyResult,
  PromptPlan,
} from "../../../contracts/execution/prompt-framework-models.js";
import type { PromptPlanOrchestrator } from "./orchestrator.js";

/**
 * Canonical Prompt Framework implementation.
 *
 * It coordinates PromptUnit execution through the orchestrator and delegates
 * deterministic output assembly to the supplied assembler.
 */
export class GovernedPromptFramework<TStructuredResult>
  implements PromptFramework<TStructuredResult> {
  constructor(
    private readonly orchestrator: PromptPlanOrchestrator,
    private readonly assembly: PromptAssembly<TStructuredResult>,
  ) {}

  async execute(plan: PromptPlan): Promise<PromptAssemblyResult<TStructuredResult>> {
    const execution = await this.orchestrator.executePlan(plan);

    return this.assembly.assemble(plan, execution.unit_results);
  }
}
