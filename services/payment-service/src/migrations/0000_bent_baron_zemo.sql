CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
