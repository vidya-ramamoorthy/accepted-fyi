import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getServerConfig } from "@/lib/config";

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (cachedDb) return cachedDb;

  const { database } = getServerConfig();
  const client = postgres(database.url, { prepare: false });
  cachedDb = drizzle(client, { schema });
  return cachedDb;
}
