export type BuilderExecutionStartEvent = {
  builderType: string;
  executionId: string;
  companyId: string;
  periodId: string;
  startedAt: string;
};

export type BuilderExecutionSuccessEvent = BuilderExecutionStartEvent & {
  executionTimeMs: number;
  artifactId: string;
};

export type BuilderExecutionFailureEvent = BuilderExecutionStartEvent & {
  executionTimeMs: number;
  failureReason: string;
};

export interface BuilderObserver {
  onExecutionStart(event: BuilderExecutionStartEvent): void;

  onExecutionSuccess(event: BuilderExecutionSuccessEvent): void;

  onExecutionFailure(event: BuilderExecutionFailureEvent): void;
}

export class NoopBuilderObserver implements BuilderObserver {
  onExecutionStart(): void {}

  onExecutionSuccess(): void {}

  onExecutionFailure(): void {}
}

