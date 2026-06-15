export type LLMMessage = {
  role: "system" | "user";
  content: string;
};

export type LLMRequest = {
  model: string;
  temperature: 0;
  messages: LLMMessage[];
};

export type LLMResponse = {
  output_text: string;
  token_usage?: number;
};

export interface LLMClient {
  callLLM(request: LLMRequest): Promise<LLMResponse>;
}

export function callLLM(client: LLMClient, request: LLMRequest): Promise<LLMResponse> {
  return client.callLLM(request);
}

