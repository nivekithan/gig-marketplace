import { db } from "~/lib/utils/db.server";
import { proposalTable } from "./schema.server";
import { and, eq, sql } from "drizzle-orm";

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

export async function getNumberOfProposalForGig({ gigId }: { gigId: string }) {
  const noOfProposals = await db
    .select({ count: sql<number>`cast(count(${proposalTable.id}) as int)` })
    .from(proposalTable)
    .where(eq(proposalTable.gigId, gigId));

  if (noOfProposals.length === 0) {
    return 0;
  }

  return noOfProposals[0].count;
}

export async function editProposal({
  createdBy,
  gigId,
  proposal,
}: {
  gigId: string;
  createdBy: string;
  proposal: string;
}) {
  const editedProposal = await db
    .update(proposalTable)
    .set({ proposal: proposal, updatedAt: new Date() })
    .where(
      and(
        eq(proposalTable.gigId, gigId),
        eq(proposalTable.createdBy, createdBy),
      ),
    )
    .returning();

  if (editedProposal.length !== 1) {
    throw new Error(
      "Unexpected Error: Edited proposal is not returned by the database",
    );
  }

  return editedProposal[0];
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
