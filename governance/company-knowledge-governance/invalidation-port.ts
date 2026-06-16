import type { InvalidationHandoff } from "./types.js";

export interface InvalidationPort {
  onCompanyKnowledgeChanged(event: InvalidationHandoff): Promise<void>;
}

export class RecordingInvalidationPort implements InvalidationPort {
  readonly events: InvalidationHandoff[] = [];

  async onCompanyKnowledgeChanged(event: InvalidationHandoff): Promise<void> {
    this.events.push(JSON.parse(JSON.stringify(event)) as InvalidationHandoff);
  }
}

