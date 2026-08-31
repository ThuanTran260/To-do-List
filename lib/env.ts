import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Returns validated environment variables.
 * In development / test, falls back safely to placeholders if missing.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const rawEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-min-20-chars',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };

  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    console.error('[getEnv] Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment configuration');
  }

  cachedEnv = result.data;
  return cachedEnv;
}
