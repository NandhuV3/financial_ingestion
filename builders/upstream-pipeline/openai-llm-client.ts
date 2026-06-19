import type {
  LLMClient,
  LLMRequest,
  LLMResponse,
} from "../../packages/llm-framework/src/llm-client.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: {
    total_tokens?: number;
  };
};

export class OpenAIResponsesLLMClient implements LLMClient {
  constructor(
    private readonly apiKey: string,
    private readonly endpoint = OPENAI_RESPONSES_URL,
  ) {
    if (!apiKey.trim()) {
      throw new Error("OPENAI_API_KEY is required for the upstream demo.");
    }
  }

  async callLLM(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        temperature: request.temperature,
        input: request.messages,
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `OpenAI request failed: ${response.status} ${response.statusText}\n${body}`,
      );
    }

    const payload = await response.json() as OpenAIResponsePayload;

    return {
      output_text: extractOutputText(payload),
      ...(payload.usage?.total_tokens === undefined
        ? {}
        : { token_usage: payload.usage.total_tokens }),
    };
  }
}

function extractOutputText(payload: OpenAIResponsePayload): string {
  if (typeof payload.output_text === "string" && payload.output_text) {
    return payload.output_text;
  }

  const outputText = (payload.output ?? [])
    .flatMap(({ content }) => content ?? [])
    .filter(({ type, text }) =>
      type === "output_text" && typeof text === "string")
    .map(({ text }) => text)
    .join("");

  if (!outputText) {
    throw new Error("OpenAI response did not include output text.");
  }

  return outputText;
}
