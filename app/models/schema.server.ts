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
]);

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

export const proposalStatusEnum = pgEnum("proposal_status", [
  "OPEN",
  "ACCEPTED",
  "REJECTED",
]);

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
    status: proposalStatusEnum("status").default("OPEN").notNull(),
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

export const userTable = pgTable("user", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  skills: json("skills").$type<ValidGigSkills[]>(),
  credits: integer("credits").notNull().default(0),
});

export const creditCardTable = pgTable("credit_card", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  number: text("number").notNull(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => userTable.id),
});

export const paymentOrderType = pgEnum("payment_order_type", [
  "add",
  "withdraw",
]);

export const paymentHistoryTable = pgTable("payment_history", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  orderValue: integer("order_value").notNull(),
  orderType: paymentOrderType("order_type").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
