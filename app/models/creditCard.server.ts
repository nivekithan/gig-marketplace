import { db } from "~/lib/utils/db.server";
import { creditCardTable } from "./schema.server";
import { eq } from "drizzle-orm";

export async function getCreditCardDetailsForUser({
  userId,
}: {
  userId: string;
}) {
  const creditCard = await db
    .select()
    .from(creditCardTable)
    .where(eq(creditCardTable.userId, userId));

  if (creditCard.length === 0) {
    return null;
  }

  if (creditCard.length !== 1) {
    throw new Error("Unexpected Error: More than 1 credit card is returned");
  }

  return creditCard[0];
}

export async function createCreditCardForUser({
  cardNumber,
  name,
  userId,
}: {
  userId: string;
  name: string;
  cardNumber: string;
}) {
  const creditCard = await db
    .insert(creditCardTable)
    .values({ name, number: cardNumber, userId })
    .returning();

  if (creditCard.length !== 1) {
    throw new Error(
      "Unexpected Error: Created credit card is not returned from the database",
    );
  }

  return creditCard[0];
}

export async function editCreditCardForUser({
  cardNumber,
  name,
  userId,
}: {
  userId: string;
  name: string;
  cardNumber: string;
}) {
  const creditCard = await db
    .update(creditCardTable)
    .set({ name, number: cardNumber })
    .where(eq(creditCardTable.userId, userId))
    .returning();

  if (creditCard.length !== 1) {
    throw new Error(
      "Unexpected Error: Edited credit card is not returned from the database",
    );
  }

  return creditCard[0];
}
