import { z } from "zod";
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("agendamentos@seudominio.com"),
});
export const env = envSchema.parse(process.env);