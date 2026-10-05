import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  // Only warn during runtime; build time may not have DATABASE_URL set
  if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
    console.warn("DATABASE_URL is not defined in environment");
  }
}

// Enable connection caching and resilient fetch with retries for serverless cold starts
neonConfig.fetchConnectionCache = true;
const originalFetch = globalThis.fetch;
if (originalFetch) {
  neonConfig.fetchFunction = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await originalFetch(input, init);
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          // Wait before retry to give sleeping serverless compute time to wake up
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        }
      }
    }
    throw lastError;
  };
}

const sql = neon(process.env.DATABASE_URL || "");
export const db = drizzle(sql, { schema });
export { schema };
