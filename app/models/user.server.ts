import { db } from "~/lib/utils/db.server";
import { eq, sql } from "drizzle-orm";
import { paymentHistoryTable, userTable } from "./schema.server";
import { ValidGigSkills } from "./skills";
import {
  storeBuyingCredit,
  storeWithdrawingCredit,
} from "~/lib/utils/pangea.server";
import * as bcrypt from "bcryptjs";

const hash = bcrypt.hash;

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

export async function getUserCredits({ userId }: { userId: string }) {
  const user = await db
    .select({ credits: userTable.credits })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (user.length !== 1) {
    throw new Error("Unexpected Error: Multiple credits got returned");
  }

  return user[0].credits;
}

export async function addCreditsToUser({
  userId,
  credits,
}: {
  userId: string;
  credits: number;
}) {
  await db.transaction(async (tx) => {
    const currentUserCredits = await getUserCredits({ userId });
    await tx
      .insert(paymentHistoryTable)
      .values({ userId, orderValue: credits, orderType: "add" });
    await tx
      .update(userTable)
      .set({ credits: sql`${userTable.credits} + ${credits}` })
      .where(eq(userTable.id, userId));
    await storeBuyingCredit({
      userId,
      oldCredit: currentUserCredits,
      newCredit: currentUserCredits + credits,
    });
  });
}

export async function withdrawCredits({
  credits,
  userId,
  saveTransaction = true,
}: {
  userId: string;
  credits: number;
  saveTransaction?: boolean;
}) {
  if (saveTransaction) {
    await db.transaction(async (db) => {
      const currentUserCredits = await getUserCredits({ userId });
      await db
        .insert(paymentHistoryTable)
        .values({ userId, orderValue: credits, orderType: "withdraw" });

      await db
        .update(userTable)
        .set({ credits: sql`${userTable.credits} - ${credits}` })
        .where(eq(userTable.id, userId));
      await storeWithdrawingCredit({
        userId,
        oldCredit: currentUserCredits,
        newCredit: currentUserCredits + credits,
      });
    });
  } else {
    db.transaction(async (tx) => {
      const currentUserCredits = await getUserCredits({ userId });

      await tx
        .update(userTable)
        .set({ credits: sql`${userTable.credits} - ${credits}` })
        .where(eq(userTable.id, userId));

      await storeWithdrawingCredit({
        userId,
        oldCredit: currentUserCredits,
        newCredit: currentUserCredits + credits,
      });
    });
  }
}

export function whiteLabelUser({ email, id, name, skills }: UserRow) {
  return { email, id, name, skills };
}

export type ClientUSerRow = ReturnType<typeof whiteLabelUser>;
