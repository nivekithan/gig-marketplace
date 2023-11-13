import { hash } from "bcryptjs";
import { db } from "~/lib/utils/db.server";
import { eq } from "drizzle-orm";
import { userTable } from "./schema.server";

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

export async function getUser({ email }: { email: string }) {
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
