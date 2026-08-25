ALTER TABLE "visit_events" ADD COLUMN IF NOT EXISTS "ip_address" varchar(128);
ALTER TABLE "visit_events" ADD COLUMN IF NOT EXISTS "user_agent" varchar(500);
ALTER TABLE "visit_events" ADD COLUMN IF NOT EXISTS "is_suspicious" boolean NOT NULL DEFAULT false;
UPDATE "visit_events" SET "ip_address" = 'unknown' WHERE "ip_address" IS NULL;
ALTER TABLE "visit_events" ALTER COLUMN "ip_address" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "visit_events_ip_address_idx" ON "visit_events" ("ip_address");
--> statement-breakpoint
