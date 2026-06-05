import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import { registerPartnerIntelligenceRoutes } from "./routes/partner-intelligence.routes.js";
import { createLogger } from "../shared/logger.js";

const logger = createLogger("partner-intelligence-api");
const defaultPort = 4310;

export async function createPartnerIntelligenceServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error.validation) {
      reply.code(400).send({ error: "Validation error" });
      return;
    }

    logger.error("Unhandled Partner Intelligence API error.", {
      error: error.message,
    });
    reply.code(500).send({ error: "Internal server error" });
  });

  app.get("/health", async () => ({ status: "ok" }));
  await registerPartnerIntelligenceRoutes(app);

  return app;
}

export async function startPartnerIntelligenceServer(port = defaultPort): Promise<FastifyInstance> {
  const app = await createPartnerIntelligenceServer();

  await app.listen({
    port,
    host: "0.0.0.0",
  });

  logger.info("Partner Intelligence API listening.", {
    port,
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? defaultPort);

  startPartnerIntelligenceServer(port).catch((error) => {
    logger.error("Failed to start Partner Intelligence API.", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  });
}
