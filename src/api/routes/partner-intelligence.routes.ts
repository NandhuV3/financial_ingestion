import type { FastifyInstance } from "fastify";
import { buildPartnerCompanyIntelligence } from "../../partner-domain/build-partner-intelligence.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger("partner-intelligence-api");

type PartnerIntelligenceParams = {
  ticker: string;
};

type PartnerIntelligenceQuery = {
  filingDate?: string;
};

export async function registerPartnerIntelligenceRoutes(app: FastifyInstance): Promise<void> {
  app.route({
    method: ["POST", "PUT", "PATCH", "DELETE"],
    url: "/partner-intelligence/:ticker",
    handler: async (_request, reply) => reply.code(405).send({ error: "method_not_allowed" }),
  });

  app.get<{
    Params: PartnerIntelligenceParams;
    Querystring: PartnerIntelligenceQuery;
  }>("/partner-intelligence/:ticker", {
    schema: {
      params: {
        type: "object",
        required: ["ticker"],
        properties: {
          ticker: {
            type: "string",
            minLength: 1,
            pattern: "^[A-Za-z]+$",
          },
        },
        additionalProperties: false,
      },
      querystring: {
        type: "object",
        properties: {
          filingDate: {
            type: "string",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const startedAt = Date.now();
    const ticker = request.params.ticker.trim().toUpperCase();

    try {
      const result = await buildPartnerCompanyIntelligence(ticker, request.query.filingDate);

      logger.info("Partner intelligence served.", {
        ticker,
        filing_date: result.asOfFilingDate,
        duration_ms: Date.now() - startedAt,
      });

      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("Unsupported ticker")) {
        return reply.code(404).send({ error: "Ticker not found" });
      }

      if (message.includes("No filing directories found") || message.includes("ENOENT")) {
        return reply.code(404).send({ error: "Filing not found" });
      }

      logger.error("Partner intelligence request failed.", {
        ticker,
        error: message,
        duration_ms: Date.now() - startedAt,
      });

      return reply.code(500).send({ error: "Internal server error" });
    }
  });
}
