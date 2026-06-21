// Central configuration. Reads environment variables once with sensible
// fallbacks. Does NOT throw at import time (so tests and tooling can import
// modules freely) — call `validateConfig()` at server startup for hard checks.

const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',

  backendPort: parseInt(process.env.BACKEND_PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  jwtSecret: process.env.JWT_SECRET || '',
  databaseUrl: process.env.DATABASE_URL || '',

  frontendUrl: process.env.FRONTEND_URL || '',
  qrFrontendUrl:
    process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '',

  logLevel: process.env.LOG_LEVEL || 'info',

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
} as const;

/** CORS origin in the shape `@fastify/cors` expects (`true` for `*`). */
export function corsOrigins(): true | string[] {
  return config.corsOrigin === '*'
    ? true
    : config.corsOrigin.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Returns the list of required env vars that are missing (empty = OK). */
export function validateConfig(): string[] {
  const missing: string[] = [];
  if (!process.env.NODE_ENV) missing.push('NODE_ENV');
  if (!config.jwtSecret) missing.push('JWT_SECRET');
  if (!config.databaseUrl) missing.push('DATABASE_URL');
  return missing;
}
