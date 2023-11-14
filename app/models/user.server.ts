import { hash } from "bcryptjs";
import { db } from "~/lib/utils/db.server";
import { eq } from "drizzle-orm";
import { userTable } from "./schema.server";
import { ValidGigSkills } from "./skills";

export type UserRow = typeof userTable.$inferSelect;

export async function createUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const hashedPassword = await hash(password, 10);

  const createdUser = await db
    .insert(userTable)
    .values({ email, password: hashedPassword })
    .returning();

  if (createdUser.length !== 1) {
    throw new Error("Unexpected Error");
  }

  return createdUser[0];
}

export async function getUserByEmail({ email }: { email: string }) {
  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email));

  if (user.length === 0) {
    return null;
  }

  if (user.length > 1) {
    throw new Error("unexpected Error");
  }

  return user[0];
}

export async function getUserById({ userId }: { userId: string }) {
  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (user.length === 0) {
    return null;
  }

  if (user.length > 1) {
    throw new Error("Unexpected Error: Multiple users returned from database");
  }

  return user[0];
}

export async function editUser({
  email,
  name,
  skills,
  userId,
}: {
  userId: string;
  name: string;
  email: string;
  skills: ValidGigSkills[];
}) {
  const user = await db
    .update(userTable)
    .set({ email, name, skills })
    .where(eq(userTable.id, userId))
    .returning();

  if (user.length !== 1) {
    throw new Error("Unexpected Error: Multiple users got updated");
  }

  return user[0];
}

export function whiteLabelUser({ email, id, name, skills }: UserRow) {
  return { email, id, name, skills };
}
