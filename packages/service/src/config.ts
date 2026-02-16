import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    DATABASE_URL: z.string().min(1).default('file:./dev.db'),
    PORT: z.string().transform(Number).default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CMS_BASE_URL: z.string().url().default('http://127.0.0.1:5000'),
    CMS_PUBLIC_URL: z.string().url().default('http://127.0.0.1:5000'),
    SESSION_SECRET: z.string().min(32).default('a-very-long-secret-key-that-is-at-least-32-characters-long'),
    SESSION_COOKIE_NAME: z.string().default('session'),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    SESSION_MAX_AGE: z.string().transform(Number).default('86400000'),
    AI_PROVIDER: z.enum(['openai', 'gemini']).default('gemini'),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_API_URL: z.string().url().default('https://generativelanguage.googleapis.com'),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    GEMINI_USE_CACHING: z.string().transform(v => v === 'true').default('false'),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_API_URL: z.string().url().default('https://api.openai.com/v1/chat/completions'),
    OPENAI_MODEL: z.string().default('gpt-4o'),
    LOG_LEVEL_FASTIFY: z.enum(['debug', 'info', 'warn', 'error']).default('warn'),
    LOG_LEVEL_SERVICE: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    LOG_LEVEL_MODEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    LOG_LEVEL_INFRASTRUCTURE: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});


const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', _env.error.format());
    process.exit(1);
}

export const config = _env.data;

export type Config = typeof config;
