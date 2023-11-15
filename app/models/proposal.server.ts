import { db } from "~/lib/utils/db.server";
import { gigsTable, proposalTable, userTable } from "./schema.server";
import { and, desc, eq, sql } from "drizzle-orm";

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

export async function deleteProposalByUserOnGig({
  gigId,
  userId,
}: {
  gigId: string;
  userId: string;
}) {
  const deletedProposal = await db
    .delete(proposalTable)
    .where(
      and(eq(proposalTable.createdBy, userId), eq(proposalTable.gigId, gigId)),
    )
    .returning();

  if (deletedProposal.length !== 1) {
    throw new Error(
      "Unexpected Error: Deleted Proposal is not returned by the database",
    );
  }
  return deletedProposal[0];
}
export async function getAllOpenProposalForGig({ gigId }: { gigId: string }) {
  const allProposals = await db
    .select()
    .from(proposalTable)
    .where(
      and(eq(proposalTable.gigId, gigId), eq(proposalTable.status, "OPEN")),
    )
    .orderBy(desc(proposalTable.createdAt))
    .innerJoin(userTable, eq(proposalTable.createdBy, userTable.id));

  return allProposals;
}

export async function rejectProposal({ id }: { id: string }) {
  await db
    .update(proposalTable)
    .set({ status: "REJECTED" })
    .where(eq(proposalTable.id, id));
}

export async function acceptProposalForGig({
  id,
  gigId,
}: {
  id: string;
  gigId: string;
}) {
  await db.transaction(async (tx) => {
    await tx
      .update(gigsTable)
      .set({ status: "ASSIGNED" })
      .where(eq(gigsTable.id, gigId));
    await tx
      .update(proposalTable)
      .set({ status: "ACCEPTED" })
      .where(and(eq(proposalTable.id, id), eq(proposalTable.gigId, gigId)));
  });
}

export type ProposalRow = typeof proposalTable.$inferSelect;

export function whiteLableProposal(proposal: ProposalRow) {
  return {
    id: proposal.id,
    proposal: proposal.proposal,
    createdAt: proposal.createdAt.toString(),
    gigId: proposal.gigId,
    createdBy: proposal.createdBy,
  };
}

export type ClientProposalRow = ReturnType<typeof whiteLableProposal>;
