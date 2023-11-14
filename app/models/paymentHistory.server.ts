import { db } from "~/lib/utils/db.server";
import { paymentHistoryTable } from "./schema.server";
import { desc, eq } from "drizzle-orm";

export async function getPaymentHistoryForUser({ userId }: { userId: string }) {
  const paymentHistory = await db
    .select()
    .from(paymentHistoryTable)
    .where(eq(paymentHistoryTable.userId, userId))
    .orderBy(desc(paymentHistoryTable.createdAt));

  return paymentHistory;
}

export function whitelabelPaymentHistory(
  paymentHistory: typeof paymentHistoryTable.$inferSelect,
) {
  return {
    id: paymentHistory.id,
    createdAt: paymentHistory.createdAt.toString(),
    orderType: paymentHistory.orderType,
    orderValue: paymentHistory.orderValue,
  };
}

export type ClientPaymentHistoryRow = ReturnType<
  typeof whitelabelPaymentHistory
>;
