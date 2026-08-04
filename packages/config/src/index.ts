import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4000'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['local', 'r2', 's3']).default('local'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_REGION: z.string().optional(),
  ENABLE_REDIS: z.string().transform((v) => v === 'true').default('false'),
  ENABLE_R2: z.string().transform((v) => v === 'true').default('false'),
  ENABLE_METRICS: z.string().transform((v) => v === 'true').default('true'),
  ENABLE_TELEMETRY: z.string().transform((v) => v === 'true').default('true'),
});

export type Env = z.infer<typeof EnvSchema>;

export const env = EnvSchema.parse(process.env);
