CREATE TABLE "vehicle_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid,
	"vehicle_reference" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"postal_code" text NOT NULL,
	"consent" boolean NOT NULL,
	"status" text DEFAULT 'nouvelle' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vehicle_requests" ADD CONSTRAINT "vehicle_requests_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demandes_date_idx" ON "vehicle_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "demandes_vehicule_idx" ON "vehicle_requests" USING btree ("vehicle_id");