import { defineConfig } from "drizzle-kit";
import { env } from "~/lib/utils/env.server";

console.log({ pgDatabase: env.PG_DATABASE });
export default defineConfig({
  schema: "./app/models/schema.server.ts",
  driver: "pg",
  dbCredentials: {
    database: env.PG_DATABASE,
    host: env.PG_HOST,
    password: env.PG_PASSWORD,
    user: env.PG_USER,
    ssl: true,
  },
  out: "drizzle",
});
