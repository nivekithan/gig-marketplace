import { db } from "~/lib/utils/db.server";
import { proposalTable } from "./schema.server";
import { and, eq } from "drizzle-orm";

export async function createProposal({
  createdBy,
  gigId,
  proposal,
}: {
  gigId: string;
  createdBy: string;
  proposal: string;
}) {
  const createdProposal = await db
    .insert(proposalTable)
    .values({ createdBy, gigId, proposal })
    .returning();

  if (createdProposal.length !== 1) {
    throw new Error(
      "Unexpected error: Created proposal is not returned by the database",
    );
  }

  return createdProposal[0];
}

export async function proposalByUserForGig({
  gigId,
  userId,
}: {
  userId: string;
  gigId: string;
}) {
  const proposal = await db
    .select()
    .from(proposalTable)
    .where(
      and(eq(proposalTable.createdBy, userId), eq(proposalTable.gigId, gigId)),
    );

  if (proposal.length === 0) {
    return null;
  }

  if (proposal.length !== 1) {
    throw new Error("Unexpected Error: More than 1 proposal is returned");
  }

  return proposal[0];
}
