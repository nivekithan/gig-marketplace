import { z } from "zod";

const EnvVariableSchema = z.object({
  PANGEA_DOMAIN: z.string().min(1),
  PANGEA_AUTHN_TOKEN: z.string().min(1),

  // Database
  PG_HOST: z.string().min(1),
  PG_DATABASE: z.string().min(1),
  PG_USER: z.string().min(1),
  PG_PASSWORD: z.string().min(1),

  // Cookies
  COOKIE_SECRET: z.string().min(1),
});

export type EnvVariables = z.infer<typeof EnvVariableSchema>;

export const env = EnvVariableSchema.parse(process.env);
