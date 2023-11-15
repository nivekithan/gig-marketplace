import { db } from "~/lib/utils/db.server";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import {
  gigsTable,
  paymentHistoryTable,
  proposalTable,
  userTable,
} from "./schema.server";
import { ValidGigSkills } from "./skills";

export type GigRow = typeof gigsTable.$inferSelect;

export async function gigById({ id }: { id: string }) {
  const gigs = await db.select().from(gigsTable).where(eq(gigsTable.id, id));

  if (gigs.length === 0) {
    return null;
  }

  if (gigs.length !== 1) {
    throw new Error("Unexpected Error: Mutliple gigs got returned");
  }

  return gigs[0];
}

export async function getAllGigsProposedByUser({ userId }: { userId: string }) {
  const gigs = await db
    .select({
      id: gigsTable.id,
      name: gigsTable.name,
      description: gigsTable.description,
      price: gigsTable.price,
      status: gigsTable.status,
      skills: gigsTable.skills,
      createdAt: gigsTable.createdAt,
      updatedAt: gigsTable.updatedAt,
    })
    .from(proposalTable)
    .where(eq(proposalTable.createdBy, userId))
    .innerJoin(gigsTable, eq(proposalTable.gigId, gigsTable.id));

  return gigs;
}

export async function createGigs({
  description,
  name,
  price,
  createdByUserId,
  skills,
}: {
  name: string;
  description: string;
  price: number;
  createdByUserId: string;
  skills: ValidGigSkills[];
}) {
  const createdGigs = await db
    .insert(gigsTable)
    .values({
      description,
      name,
      status: "CREATED",
      price,
      createdBy: createdByUserId,
      skills,
    })
    .returning();

  if (createdGigs.length !== 1) {
    throw new Error("Unexpected error while creating gigs table");
  }

  return createdGigs[0];
}

export async function getGigsCreatedBy({ userId }: { userId: string }) {
  const gigs = await db
    .select()
    .from(gigsTable)
    .where(eq(gigsTable.createdBy, userId));

  return gigs;
}

export async function latestGigsNotCreatedBy({ userId }: { userId: string }) {
  const gigs = await db
    .select()
    .from(gigsTable)
    .where(ne(gigsTable.createdBy, userId))
    .orderBy(desc(gigsTable.createdAt));

  return gigs;
}

export async function editGigs({
  description,
  name,
  createdBy,
  id,
}: {
  name: string;
  description: string;
  createdBy: string;
  id: string;
}) {
  const updatedGig = await db
    .update(gigsTable)
    .set({ description, name })
    .where(and(eq(gigsTable.id, id), eq(gigsTable.createdBy, createdBy)))
    .returning();

  if (updatedGig.length !== 1) {
    throw new Error(
      "Unexpected Error: Updating gigs did not return updated gig",
    );
  }

  return updatedGig[0];
}

export async function deleteGig({
  createdBy,
  id,
}: {
  id: string;
  createdBy: string;
}) {
  const deletedGig = await db
    .delete(gigsTable)
    .where(and(eq(gigsTable.id, id), eq(gigsTable.createdBy, createdBy)))
    .returning();

  if (deletedGig.length !== 1) {
    throw new Error(
      "Unexpected Error: Deleted gig is not returned from the database",
    );
  }

  return deletedGig[0];
}

export async function finishGig({ id }: { id: string }) {
  await db.transaction(async (tx) => {
    const gig = await tx
      .select({ price: gigsTable.price })
      .from(gigsTable)
      .where(eq(gigsTable.id, id));

    if (gig.length !== 1) {
      throw new Error(
        "unexpected Error: More than one gigs has been returned from database",
      );
    }

    const accpetedProposal = await tx
      .select({ userId: userTable.id })
      .from(proposalTable)
      .where(
        and(eq(proposalTable.gigId, id), eq(proposalTable.status, "ACCEPTED")),
      )
      .innerJoin(userTable, eq(proposalTable.createdBy, userTable.id));

    if (accpetedProposal.length !== 1) {
      throw new Error(
        "Unexpected Error: More than one proposal has been returned from database",
      );
    }

    const gigFinishedByUser = accpetedProposal[0].userId;
    const price = gig[0].price;

    console.log(gigFinishedByUser);
    await tx.insert(paymentHistoryTable).values({
      orderType: "gig_completion",
      orderValue: price,
      userId: gigFinishedByUser,
    });

    await tx
      .update(userTable)
      .set({ credits: sql`${userTable.credits} + ${price}` })
      .where(eq(userTable.id, gigFinishedByUser));

    await tx.update(gigsTable).set({ status: "COMPLETED" });
  });
}

export function whiteLabelGigs(gigs: GigRow) {
  return {
    id: gigs.id,
    name: gigs.name,
    description: gigs.description,
    price: gigs.price,
    status: gigs.status,
    skills: gigs.skills,
    createdAt: gigs.createdAt.toString(),
    updatedAt: gigs.updatedAt.toString(),
  };
}

export type ClientGigRow = ReturnType<typeof whiteLabelGigs>;
