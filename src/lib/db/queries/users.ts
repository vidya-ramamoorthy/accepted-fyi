import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";

export async function findUserByAuthId(authUserId: string) {
  const db = getDb();
  const [user] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, authUserId))
    .limit(1);

  return user ?? null;
}

export async function createUserProfile(data: {
  authUserId: string;
  email: string;
  displayName: string;
}) {
  const db = getDb();
  const [user] = await db
    .insert(userProfiles)
    .values({
      authUserId: data.authUserId,
      email: data.email,
      displayName: data.displayName,
    })
    .returning();

  return user;
}

export async function findOrCreateUser(data: {
  authUserId: string;
  email: string;
  displayName: string;
}) {
  const existingUser = await findUserByAuthId(data.authUserId);
  if (existingUser) return existingUser;

  return createUserProfile(data);
}

export async function markUserAsSubmitted(authUserId: string) {
  const db = getDb();
  const [updatedUser] = await db
    .update(userProfiles)
    .set({ hasSubmitted: true, updatedAt: new Date() })
    .where(eq(userProfiles.authUserId, authUserId))
    .returning();

  return updatedUser;
}

export async function getUserSubmissionStatus(authUserId: string) {
  const user = await findUserByAuthId(authUserId);
  return user?.hasSubmitted ?? false;
}
