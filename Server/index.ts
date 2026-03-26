import "dotenv/config";

import app from "./src/app";
import { env } from "./src/config/env";
import prisma from "./src/lib/prisma";

const server = app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
