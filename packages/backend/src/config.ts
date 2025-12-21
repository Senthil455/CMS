import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    PORT: z.string().transform(Number).default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', _env.error.format());
    process.exit(1);
}

export const config = _env.data;

export type Config = typeof config;
