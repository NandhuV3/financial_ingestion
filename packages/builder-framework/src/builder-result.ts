import type { ExecutionRecordReference } from "../../../contracts/framework/execution-record-reference.js";

export type BuilderResult<TOutput> = {
  content: TOutput;
  confidence?: number;
  execution_references?: ExecutionRecordReference[];
};
