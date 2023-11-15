DO $$ BEGIN
 CREATE TYPE "gigs_status" AS ENUM('CREATED', 'COMPLETED', 'ASSIGNED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "payment_order_type" AS ENUM('add', 'withdraw', 'gig_completion');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "proposal_status" AS ENUM('OPEN', 'ACCEPTED', 'REJECTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_card" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "credit_card_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gigs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"status" "gigs_status" NOT NULL,
	"skills" json NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_by" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"embedding_content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"order_value" integer NOT NULL,
	"order_type" "payment_order_type" NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proposal" (
	"id" text PRIMARY KEY NOT NULL,
	"gig_id" text NOT NULL,
	"proposal" text NOT NULL,
	"status" "proposal_status" DEFAULT 'OPEN' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "proposal_gig_id_created_by_unique" UNIQUE("gig_id","created_by")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"skills" json,
	"credits" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_card" ADD CONSTRAINT "credit_card_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gigs" ADD CONSTRAINT "gigs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposal" ADD CONSTRAINT "proposal_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "gigs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposal" ADD CONSTRAINT "proposal_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
