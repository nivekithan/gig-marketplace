import {
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import crypto from "crypto";
import { ValidGigSkills } from "./skills";

export const gigsStatusEnum = pgEnum("gigs_status", [
  "CREATED",
  "COMPLETED",
  "ASSIGNED",
] as const);

export const gigsTable = pgTable("gigs", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  status: gigsStatusEnum("status").notNull(),
  skills: json("skills").notNull().$type<ValidGigSkills[]>(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => userTable.id),
});

export const proposalTable = pgTable(
  "proposal",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    gigId: text("gig_id")
      .notNull()
      .references(() => gigsTable.id),
    proposal: text("proposal").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => userTable.id),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => {
    return { unq: unique().on(t.gigId, t.createdBy) };
  },
);

export const userTable = pgTable("user_table", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});
