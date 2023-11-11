import { defineConfig } from "drizzle-kit";
import { env } from "~/lib/utils/env.server";

export default defineConfig({
  schema: "./app/models/**",
  driver: "pg",
  dbCredentials: {
    database: env.PG_DATABASE,
    host: env.PG_HOST,
    password: env.PG_PASSWORD,
    user: env.PG_USER,
    ssl: true,
  },
  strict: true,
  out: "drizzle",
});
