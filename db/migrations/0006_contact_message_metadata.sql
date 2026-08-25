ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "ip_address" varchar(128);
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "user_agent" varchar(500);
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "device_type" varchar(32);
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "browser" varchar(80);
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "operating_system" varchar(80);
CREATE INDEX IF NOT EXISTS "contact_messages_ip_address_idx" ON "contact_messages" ("ip_address");
CREATE INDEX IF NOT EXISTS "contact_messages_created_at_idx" ON "contact_messages" ("created_at");
--> statement-breakpoint


COMMENT ON COLUMN "contact_messages"."ip_address" IS 'Server-derived client IP; admin-only abuse monitoring metadata.';
COMMENT ON COLUMN "contact_messages"."user_agent" IS 'Server-captured user-agent; admin-only abuse monitoring metadata.';
--> statement-breakpoint
