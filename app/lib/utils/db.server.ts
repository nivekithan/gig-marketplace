import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/lib/utils/env.server";

const queryClient = postgres({
  username: env.PG_USER,
  password: env.PG_PASSWORD,
  host: env.PG_HOST,
  database: env.PG_DATABASE,
  ssl: "require",
});

export const db = drizzle(queryClient);
