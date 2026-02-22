import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getServerConfig } from "@/lib/config";

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (cachedDb) return cachedDb;

  const { database } = getServerConfig();
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  const client = postgres(database.url, {
    prepare: false,
    max: isBuild ? 2 : 10,
    idle_timeout: isBuild ? 5 : 20,
    connect_timeout: 10,
  });
  cachedDb = drizzle(client, { schema });
  return cachedDb;
}
