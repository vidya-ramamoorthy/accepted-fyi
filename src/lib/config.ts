export interface ServerConfig {
  database: {
    url: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  redis: {
    url: string;
    token: string;
  } | null;
}

export interface PublicConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
}

let cachedServerConfig: ServerConfig | null = null;
let cachedPublicConfig: PublicConfig | null = null;

/**
 * Validates and returns all required server-side env vars.
 * Throws a single error listing ALL missing required vars.
 * Redis vars are optional — returns null when absent.
 * Result is cached after first successful call.
 */
export function getServerConfig(): ServerConfig {
  if (cachedServerConfig) return cachedServerConfig;

  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}. See .env.local.example`
    );
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisConfig = redisUrl && redisToken ? { url: redisUrl, token: redisToken } : null;

  cachedServerConfig = {
    database: {
      url: requiredVars.DATABASE_URL!,
    },
    supabase: {
      url: requiredVars.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: requiredVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    redis: redisConfig,
  };

  return cachedServerConfig;
}

/**
 * Returns public (NEXT_PUBLIC_*) config for client-side use.
 * Throws a single error listing ALL missing required vars.
 * Result is cached after first successful call.
 */
export function getPublicConfig(): PublicConfig {
  if (cachedPublicConfig) return cachedPublicConfig;

  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}. See .env.local.example`
    );
  }

  cachedPublicConfig = {
    supabase: {
      url: requiredVars.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: requiredVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  };

  return cachedPublicConfig;
}
