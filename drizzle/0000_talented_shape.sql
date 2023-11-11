CREATE TABLE IF NOT EXISTS "user_table" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "user_table_email_unique" UNIQUE("email")
);
