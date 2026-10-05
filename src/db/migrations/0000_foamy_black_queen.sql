CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"published_at" timestamp with time zone,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"action" text NOT NULL,
	"previous_status" text,
	"new_status" text NOT NULL,
	"previous_start" timestamp with time zone,
	"new_start" timestamp with time zone,
	"changed_by_user_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_request_id" uuid,
	"student_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'SCHEDULED' NOT NULL,
	"meeting_location" text DEFAULT 'Career Services Centre, KSITM' NOT NULL,
	"student_visible_notes" text,
	"internal_staff_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" text DEFAULT 'IN_PROGRESS' NOT NULL,
	"score" integer,
	"human_recommendation" text,
	"ai_feedback" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"question_type" text NOT NULL,
	"options" jsonb,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"response_text" text,
	"score_value" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "career_services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "consultation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"category" text NOT NULL,
	"reason" text NOT NULL,
	"preferred_date" date NOT NULL,
	"preferred_time_slot" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"student_notes" text,
	"reviewed_by_staff_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"industry" text NOT NULL,
	"website_url" text,
	"logo_url" text,
	"description" text,
	"location" text,
	"is_partner" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"caption" text NOT NULL,
	"image_url" text NOT NULL,
	"image_alt" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leadership_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"position" text NOT NULL,
	"image_url" text NOT NULL,
	"image_alt" text NOT NULL,
	"summary" text NOT NULL,
	"biography" jsonb NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"full_name" text NOT NULL,
	"title" text NOT NULL,
	"organization" text,
	"specialization" text NOT NULL,
	"bio" text NOT NULL,
	"avatar_url" text,
	"max_mentees" integer DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"assigned_by_user_id" uuid NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"preferred_mentor_id" uuid,
	"area_of_interest" text NOT NULL,
	"goals" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"organization_name" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text,
	"skills" text,
	"location_type" text DEFAULT 'REMOTE' NOT NULL,
	"application_url" text,
	"application_deadline" date,
	"start_date" date,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resume_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"issuing_organization" text NOT NULL,
	"issue_date" text,
	"expiration_date" text,
	"credential_id" text,
	"credential_url" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resume_education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_profile_id" uuid NOT NULL,
	"institution" text NOT NULL,
	"qualification" text NOT NULL,
	"field_of_study" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"grade" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resume_experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_profile_id" uuid NOT NULL,
	"organization" text NOT NULL,
	"role_title" text NOT NULL,
	"location" text,
	"start_date" text NOT NULL,
	"end_date" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resume_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"location" text,
	"professional_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resume_profiles_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "resume_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"role" text,
	"project_url" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resume_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_profile_id" uuid NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"proficiency" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_entitlement_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"previous_status" text NOT NULL,
	"new_status" text NOT NULL,
	"changed_by_user_id" uuid NOT NULL,
	"consultation_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"staff_code" text,
	"designation" text,
	"can_manage_appointments" boolean DEFAULT true NOT NULL,
	"can_manage_services" boolean DEFAULT true NOT NULL,
	"can_manage_training" boolean DEFAULT false NOT NULL,
	"can_manage_mentorship" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "staff_profiles_staff_code_unique" UNIQUE("staff_code")
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reg_number" text NOT NULL,
	"full_name" text NOT NULL,
	"department" text,
	"level" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "student_profiles_reg_number_unique" UNIQUE("reg_number")
);
--> statement-breakpoint
CREATE TABLE "student_service_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"status" text DEFAULT 'LOCKED' NOT NULL,
	"activated_at" timestamp with time zone,
	"recommendation_note" text,
	"last_modified_by_staff_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_service_unique" UNIQUE("student_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "student_training_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_video_unique" UNIQUE("student_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "training_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "training_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "training_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"video_provider" text DEFAULT 'youtube' NOT NULL,
	"video_url" text NOT NULL,
	"video_id" text NOT NULL,
	"thumbnail_url" text,
	"duration_minutes" integer,
	"instructor" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "training_videos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'STUDENT' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "appointment_history" ADD CONSTRAINT "appointment_history_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_history" ADD CONSTRAINT "appointment_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_consultation_request_id_consultation_requests_id_fk" FOREIGN KEY ("consultation_request_id") REFERENCES "public"."consultation_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_id_staff_profiles_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_reviewed_by_staff_id_staff_profiles_id_fk" FOREIGN KEY ("reviewed_by_staff_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_assignments" ADD CONSTRAINT "mentorship_assignments_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_assignments" ADD CONSTRAINT "mentorship_assignments_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_assignments" ADD CONSTRAINT "mentorship_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_preferred_mentor_id_mentors_id_fk" FOREIGN KEY ("preferred_mentor_id") REFERENCES "public"."mentors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_certifications" ADD CONSTRAINT "resume_certifications_resume_profile_id_resume_profiles_id_fk" FOREIGN KEY ("resume_profile_id") REFERENCES "public"."resume_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_education" ADD CONSTRAINT "resume_education_resume_profile_id_resume_profiles_id_fk" FOREIGN KEY ("resume_profile_id") REFERENCES "public"."resume_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_experience" ADD CONSTRAINT "resume_experience_resume_profile_id_resume_profiles_id_fk" FOREIGN KEY ("resume_profile_id") REFERENCES "public"."resume_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_profiles" ADD CONSTRAINT "resume_profiles_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_projects" ADD CONSTRAINT "resume_projects_resume_profile_id_resume_profiles_id_fk" FOREIGN KEY ("resume_profile_id") REFERENCES "public"."resume_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_skills" ADD CONSTRAINT "resume_skills_resume_profile_id_resume_profiles_id_fk" FOREIGN KEY ("resume_profile_id") REFERENCES "public"."resume_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_entitlement_history" ADD CONSTRAINT "service_entitlement_history_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_entitlement_history" ADD CONSTRAINT "service_entitlement_history_service_id_career_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."career_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_entitlement_history" ADD CONSTRAINT "service_entitlement_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_service_entitlements" ADD CONSTRAINT "student_service_entitlements_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_service_entitlements" ADD CONSTRAINT "student_service_entitlements_service_id_career_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."career_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_service_entitlements" ADD CONSTRAINT "student_service_entitlements_last_modified_by_staff_id_staff_profiles_id_fk" FOREIGN KEY ("last_modified_by_staff_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_training_progress" ADD CONSTRAINT "student_training_progress_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_training_progress" ADD CONSTRAINT "student_training_progress_video_id_training_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."training_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_videos" ADD CONSTRAINT "training_videos_category_id_training_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."training_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_published_idx" ON "announcements" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "appointment_history_appointment_idx" ON "appointment_history" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "appointments_student_idx" ON "appointments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "appointments_staff_idx" ON "appointments" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointments_scheduled_start_idx" ON "appointments" USING btree ("scheduled_start");--> statement-breakpoint
CREATE INDEX "assessment_attempts_student_idx" ON "assessment_attempts" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "assessment_attempts_assessment_idx" ON "assessment_attempts" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_questions_assessment_idx" ON "assessment_questions" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_responses_attempt_idx" ON "assessment_responses" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "assessments_slug_idx" ON "assessments" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "career_services_slug_idx" ON "career_services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "consultation_requests_student_idx" ON "consultation_requests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "consultation_requests_status_idx" ON "consultation_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employers_active_idx" ON "employers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "gallery_published_idx" ON "gallery_items" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "leadership_published_idx" ON "leadership_profiles" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "mentors_active_idx" ON "mentors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "mentorship_assignments_student_idx" ON "mentorship_assignments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "mentorship_assignments_mentor_idx" ON "mentorship_assignments" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "mentorship_requests_student_idx" ON "mentorship_requests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "mentorship_requests_status_idx" ON "mentorship_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "opportunities_type_idx" ON "opportunities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "opportunities_published_idx" ON "opportunities" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "resume_certifications_profile_idx" ON "resume_certifications" USING btree ("resume_profile_id");--> statement-breakpoint
CREATE INDEX "resume_education_profile_idx" ON "resume_education" USING btree ("resume_profile_id");--> statement-breakpoint
CREATE INDEX "resume_experience_profile_idx" ON "resume_experience" USING btree ("resume_profile_id");--> statement-breakpoint
CREATE INDEX "resume_profiles_student_idx" ON "resume_profiles" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "resume_projects_profile_idx" ON "resume_projects" USING btree ("resume_profile_id");--> statement-breakpoint
CREATE INDEX "resume_skills_profile_idx" ON "resume_skills" USING btree ("resume_profile_id");--> statement-breakpoint
CREATE INDEX "entitlement_history_student_idx" ON "service_entitlement_history" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "entitlement_history_service_idx" ON "service_entitlement_history" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "sessions_token_hash_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_user_id_idx" ON "staff_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "students_reg_number_idx" ON "student_profiles" USING btree ("reg_number");--> statement-breakpoint
CREATE INDEX "students_user_id_idx" ON "student_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "student_entitlements_student_idx" ON "student_service_entitlements" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "training_progress_student_idx" ON "student_training_progress" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "training_categories_slug_idx" ON "training_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "training_videos_category_idx" ON "training_videos" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "training_videos_slug_idx" ON "training_videos" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "training_videos_published_idx" ON "training_videos" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");