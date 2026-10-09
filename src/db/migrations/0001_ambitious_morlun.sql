CREATE TABLE "learning_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_modules_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "module_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"module_version" integer NOT NULL,
	"status" text DEFAULT 'ASSIGNED' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "module_assignments_student_module_unique" UNIQUE("student_id","module_id"),
	CONSTRAINT "module_assignment_lifecycle" CHECK (("module_assignments"."status" = 'ASSIGNED' AND "module_assignments"."started_at" IS NULL AND "module_assignments"."completed_at" IS NULL) OR ("module_assignments"."status" = 'IN_PROGRESS' AND "module_assignments"."started_at" IS NOT NULL AND "module_assignments"."completed_at" IS NULL) OR ("module_assignments"."status" = 'COMPLETED' AND "module_assignments"."started_at" IS NOT NULL AND "module_assignments"."completed_at" IS NOT NULL AND "module_assignments"."completed_at" >= "module_assignments"."started_at"))
);
--> statement-breakpoint
ALTER TABLE "module_assignments" ADD CONSTRAINT "module_assignments_module_id_learning_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."learning_modules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_assignments" ADD CONSTRAINT "module_assignments_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_assignments" ADD CONSTRAINT "module_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "module_assignments_module_status_idx" ON "module_assignments" USING btree ("module_id","status","started_at");--> statement-breakpoint
CREATE INDEX "module_assignments_student_idx" ON "module_assignments" USING btree ("student_id");