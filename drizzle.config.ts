import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Migrations use a direct connection; application traffic can remain pooled.
const migrationUrl = new URL(
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!,
);
if (migrationUrl.hostname.endsWith(".neon.tech")) {
  migrationUrl.hostname = migrationUrl.hostname.replace("-pooler.", ".");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl.toString(),
  },
  verbose: true,
  strict: true,
});
