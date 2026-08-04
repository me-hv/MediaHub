import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('postgresql://postgres:postgrespassword@localhost:5432/mediahub'),
  DOWNLOAD_TIMEOUT_MS: z.coerce.number().default(300000), // 5 mins
  CACHE_TTL_HOURS: z.coerce.number().default(6),
  RATE_LIMIT_ANALYZE_PER_MIN: z.coerce.number().default(20),
  RATE_LIMIT_DOWNLOAD_PER_MIN: z.coerce.number().default(5),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(customEnv?: Record<string, string | undefined>): Env {
  const envSource = customEnv || (typeof process !== 'undefined' ? process.env : {});
  const result = envSchema.safeParse(envSource);
  if (!result.success) {
    console.error('❌ Environment Variable Validation Errors:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}
