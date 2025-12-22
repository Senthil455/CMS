import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    PORT: z.string().transform(Number).default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CMS_BASE_URL: z.string().url().default('http://localhost:5000'),
    SESSION_SECRET: z.string().min(32).default('a-very-long-secret-key-that-is-at-least-32-characters-long'),
    SESSION_COOKIE_NAME: z.string().default('session'),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    SESSION_MAX_AGE: z.string().transform(Number).default('86400000'),
    QWEN_API_KEY: z.string().optional(),
    QWEN_API_URL: z.string().url().default('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'),
    QWEN_MODEL: z.string().default('qwen-plus'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', _env.error.format());
    process.exit(1);
}

export const config = _env.data;

export type Config = typeof config;
