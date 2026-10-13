import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { ModuleContent, ModuleStatus } from "@/lib/modules";

export const learningModules = pgTable("learning_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: jsonb("content").$type<ModuleContent>().notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// 1. CORE IDENTITY, ROLES & SESSIONS
// ============================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["STUDENT", "STAFF", "SUPER_ADMIN", "EMPLOYER"] })
      .notNull()
      .default("STUDENT"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("users_role_idx").on(table.role),
    index("users_email_idx").on(table.email),
  ],
);

export const studentMasterList = pgTable(
  "student_master_list",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regNumber: text("reg_number").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    middleName: text("middle_name"),
    fullName: text("full_name").notNull(),
    department: text("department"),
    level: text("level"),
    phone: text("phone"),
    isRegistered: boolean("is_registered").notNull().default(false),
    registeredAt: timestamp("registered_at", { withTimezone: true }),
    registeredUserId: uuid("registered_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("master_reg_number_idx").on(table.regNumber),
    index("master_is_registered_idx").on(table.isRegistered),
  ],
);

export const studentProfiles = pgTable(
  "student_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    masterRecordId: uuid("master_record_id").references(
      () => studentMasterList.id,
      { onDelete: "set null" },
    ),
    regNumber: text("reg_number").notNull().unique(),
    fullName: text("full_name").notNull(),
    department: text("department"),
    level: text("level"),
    phone: text("phone"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    linkedInUrl: text("linkedin_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("students_reg_number_idx").on(table.regNumber),
    index("students_user_id_idx").on(table.userId),
    index("students_master_record_idx").on(table.masterRecordId),
  ],
);

export const staffProfiles = pgTable(
  "staff_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    fullName: text("full_name").notNull(),
    staffCode: text("staff_code").unique(),
    designation: text("designation"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    linkedInUrl: text("linkedin_url"),
    phone: text("phone"),
    canManageAppointments: boolean("can_manage_appointments")
      .notNull()
      .default(true),
    canManageServices: boolean("can_manage_services").notNull().default(true),
    canManageTraining: boolean("can_manage_training").notNull().default(false),
    canManageMentorship: boolean("can_manage_mentorship")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("staff_user_id_idx").on(table.userId)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("sessions_token_hash_idx").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

// ============================================================
// 2. CAREER SERVICES & INDIVIDUAL ENTITLEMENTS
// ============================================================

export const careerServices = pgTable(
  "career_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    icon: text("icon").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("career_services_slug_idx").on(table.slug)],
);

export const studentServiceEntitlements = pgTable(
  "student_service_entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => careerServices.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["LOCKED", "ACTIVE", "PAUSED", "COMPLETED"],
    })
      .notNull()
      .default("LOCKED"),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    recommendationNote: text("recommendation_note"),
    lastModifiedByStaffId: uuid("last_modified_by_staff_id").references(
      () => staffProfiles.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("student_service_unique").on(table.studentId, table.serviceId),
    index("student_entitlements_student_idx").on(table.studentId),
  ],
);

export const serviceEntitlementHistory = pgTable(
  "service_entitlement_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => careerServices.id, { onDelete: "cascade" }),
    previousStatus: text("previous_status").notNull(),
    newStatus: text("new_status").notNull(),
    changedByUserId: uuid("changed_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    consultationId: uuid("consultation_id"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("entitlement_history_student_idx").on(table.studentId),
    index("entitlement_history_service_idx").on(table.serviceId),
  ],
);

// ============================================================
// 3. CONSULTATIONS & APPOINTMENTS
// ============================================================

export const consultationRequests = pgTable(
  "consultation_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    reason: text("reason").notNull(),
    preferredDate: date("preferred_date").notNull(),
    preferredTimeSlot: text("preferred_time_slot").notNull(),
    status: text("status", {
      enum: [
        "REQUESTED",
        "UNDER_REVIEW",
        "SCHEDULED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
    })
      .notNull()
      .default("REQUESTED"),
    studentNotes: text("student_notes"),
    reviewedByStaffId: uuid("reviewed_by_staff_id").references(
      () => staffProfiles.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("consultation_requests_student_idx").on(table.studentId),
    index("consultation_requests_status_idx").on(table.status),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    consultationRequestId: uuid("consultation_request_id").references(
      () => consultationRequests.id,
      { onDelete: "set null" },
    ),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "restrict" }),
    scheduledStart: timestamp("scheduled_start", {
      withTimezone: true,
    }).notNull(),
    scheduledEnd: timestamp("scheduled_end", { withTimezone: true }).notNull(),
    status: text("status", {
      enum: ["SCHEDULED", "RESCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"],
    })
      .notNull()
      .default("SCHEDULED"),
    meetingLocation: text("meeting_location")
      .notNull()
      .default("Career Services Centre, KSITM"),
    studentVisibleNotes: text("student_visible_notes"),
    internalStaffNotes: text("internal_staff_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("appointments_student_idx").on(table.studentId),
    index("appointments_staff_idx").on(table.staffId),
    index("appointments_status_idx").on(table.status),
    index("appointments_scheduled_start_idx").on(table.scheduledStart),
  ],
);

export const appointmentHistory = pgTable(
  "appointment_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    previousStatus: text("previous_status"),
    newStatus: text("new_status").notNull(),
    previousStart: timestamp("previous_start", { withTimezone: true }),
    newStart: timestamp("new_start", { withTimezone: true }),
    changedByUserId: uuid("changed_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("appointment_history_appointment_idx").on(table.appointmentId),
  ],
);

// ============================================================
// 4. STRUCTURED RESUME BUILDER
// ============================================================

export const resumeProfiles = pgTable(
  "resume_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" })
      .unique(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    location: text("location"),
    professionalSummary: text("professional_summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("resume_profiles_student_idx").on(table.studentId)],
);

export const resumeEducation = pgTable(
  "resume_education",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resumeProfileId: uuid("resume_profile_id")
      .notNull()
      .references(() => resumeProfiles.id, { onDelete: "cascade" }),
    institution: text("institution").notNull(),
    qualification: text("qualification").notNull(),
    fieldOfStudy: text("field_of_study").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    isCurrent: boolean("is_current").default(false).notNull(),
    grade: text("grade"),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (table) => [index("resume_education_profile_idx").on(table.resumeProfileId)],
);

export const resumeExperience = pgTable(
  "resume_experience",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resumeProfileId: uuid("resume_profile_id")
      .notNull()
      .references(() => resumeProfiles.id, { onDelete: "cascade" }),
    organization: text("organization").notNull(),
    roleTitle: text("role_title").notNull(),
    location: text("location"),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    isCurrent: boolean("is_current").default(false).notNull(),
    description: text("description"),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (table) => [index("resume_experience_profile_idx").on(table.resumeProfileId)],
);

export const resumeSkills = pgTable(
  "resume_skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resumeProfileId: uuid("resume_profile_id")
      .notNull()
      .references(() => resumeProfiles.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    name: text("name").notNull(),
    proficiency: text("proficiency"),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (table) => [index("resume_skills_profile_idx").on(table.resumeProfileId)],
);

export const resumeCertifications = pgTable(
  "resume_certifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resumeProfileId: uuid("resume_profile_id")
      .notNull()
      .references(() => resumeProfiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    issuingOrganization: text("issuing_organization").notNull(),
    issueDate: text("issue_date"),
    expirationDate: text("expiration_date"),
    credentialId: text("credential_id"),
    credentialUrl: text("credential_url"),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (table) => [
    index("resume_certifications_profile_idx").on(table.resumeProfileId),
  ],
);

export const resumeProjects = pgTable(
  "resume_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resumeProfileId: uuid("resume_profile_id")
      .notNull()
      .references(() => resumeProfiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    role: text("role"),
    projectUrl: text("project_url"),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (table) => [index("resume_projects_profile_idx").on(table.resumeProfileId)],
);

// ============================================================
// 5. EMPLOYABILITY SKILLS TRAINING (YOUTUBE INTEGRATION)
// ============================================================

export const trainingCategories = pgTable(
  "training_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("training_categories_slug_idx").on(table.slug)],
);

export const trainingVideos = pgTable(
  "training_videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => trainingCategories.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    videoProvider: text("video_provider").notNull().default("youtube"),
    videoUrl: text("video_url").notNull(),
    videoId: text("video_id").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    durationMinutes: integer("duration_minutes"),
    instructor: text("instructor"),
    displayOrder: integer("display_order").default(0).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("training_videos_category_idx").on(table.categoryId),
    index("training_videos_slug_idx").on(table.slug),
    index("training_videos_published_idx").on(table.isPublished),
  ],
);

export const studentTrainingProgress = pgTable(
  "student_training_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => trainingVideos.id, { onDelete: "cascade" }),
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("student_video_unique").on(table.studentId, table.videoId),
    index("training_progress_student_idx").on(table.studentId),
  ],
);

// ============================================================
// 6. MENTORSHIP MODULE
// ============================================================

export const mentors = pgTable(
  "mentors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    fullName: text("full_name").notNull(),
    title: text("title").notNull(),
    organization: text("organization"),
    specialization: text("specialization").notNull(),
    bio: text("bio").notNull(),
    avatarUrl: text("avatar_url"),
    maxMentees: integer("max_mentees").default(5).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("mentors_active_idx").on(table.isActive)],
);

export const mentorshipRequests = pgTable(
  "mentorship_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    preferredMentorId: uuid("preferred_mentor_id").references(
      () => mentors.id,
      {
        onDelete: "set null",
      },
    ),
    areaOfInterest: text("area_of_interest").notNull(),
    goals: text("goals").notNull(),
    status: text("status", {
      enum: ["REQUESTED", "APPROVED", "REJECTED", "ASSIGNED"],
    })
      .notNull()
      .default("REQUESTED"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("mentorship_requests_student_idx").on(table.studentId),
    index("mentorship_requests_status_idx").on(table.status),
  ],
);

export const mentorshipAssignments = pgTable(
  "mentorship_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    mentorId: uuid("mentor_id")
      .notNull()
      .references(() => mentors.id, { onDelete: "cascade" }),
    assignedByUserId: uuid("assigned_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: text("status", {
      enum: ["ACTIVE", "COMPLETED", "TERMINATED"],
    })
      .notNull()
      .default("ACTIVE"),
    startDate: timestamp("start_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("mentorship_assignments_student_idx").on(table.studentId),
    index("mentorship_assignments_mentor_idx").on(table.mentorId),
  ],
);

// ============================================================
// 7. INTERNSHIPS & EMPLOYER ENGAGEMENT
// ============================================================

export const employers = pgTable(
  "employers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    industry: text("industry").notNull(),
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    description: text("description"),
    location: text("location"),
    isPartner: boolean("is_partner").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("employers_active_idx").on(table.isActive)],
);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id").references(() => employers.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    type: text("type", {
      enum: ["VIRTUAL_INTERNSHIP", "JOB", "CAREER_EVENT"],
    }).notNull(),
    organizationName: text("organization_name").notNull(),
    description: text("description").notNull(),
    requirements: text("requirements"),
    skills: text("skills"),
    locationType: text("location_type", {
      enum: ["REMOTE", "HYBRID", "ON_SITE"],
    })
      .notNull()
      .default("REMOTE"),
    applicationUrl: text("application_url"),
    applicationDeadline: date("application_deadline"),
    startDate: date("start_date"),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("opportunities_type_idx").on(table.type),
    index("opportunities_published_idx").on(table.isPublished),
  ],
);

// ============================================================
// 8. JOB READINESS ASSESSMENTS & AI BOUNDARY
// ============================================================

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    timeLimitMinutes: integer("time_limit_minutes").default(30).notNull(),
    passingScore: integer("passing_score").default(60).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("assessments_slug_idx").on(table.slug)],
);

export const assessmentQuestions = pgTable(
  "assessment_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    questionText: text("question_text").notNull(),
    questionType: text("question_type", {
      enum: ["MULTIPLE_CHOICE", "SCALE_1_5", "TEXT"],
    }).notNull(),
    options: jsonb("options"),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (table) => [
    index("assessment_questions_assessment_idx").on(table.assessmentId),
  ],
);

export const assessmentAttempts = pgTable(
  "assessment_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "REVIEWED"],
    })
      .notNull()
      .default("ASSIGNED"),
    score: integer("score"),
    humanRecommendation: text("human_recommendation"),
    aiFeedback: text("ai_feedback"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("assessment_attempts_student_idx").on(table.studentId),
    index("assessment_attempts_assessment_idx").on(table.assessmentId),
  ],
);

export const assessmentResponses = pgTable(
  "assessment_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => assessmentAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => assessmentQuestions.id, { onDelete: "cascade" }),
    responseText: text("response_text"),
    scoreValue: integer("score_value"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("assessment_responses_attempt_idx").on(table.attemptId)],
);

// ============================================================
// 9. SUPER ADMIN CMS & INSTITUTIONAL CONTENT
// ============================================================

export const leadershipProfiles = pgTable(
  "leadership_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    position: text("position").notNull(),
    imageUrl: text("image_url").notNull(),
    imageAlt: text("image_alt").notNull(),
    summary: text("summary").notNull(),
    biography: jsonb("biography").notNull(), // array of strings
    displayOrder: integer("display_order").default(0).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("leadership_published_idx").on(table.isPublished)],
);

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    caption: text("caption").notNull(),
    imageUrl: text("image_url").notNull(),
    imageAlt: text("image_alt").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("gallery_published_idx").on(table.isPublished)],
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("announcements_published_idx").on(table.isPublished)],
);

export const socialLinks = pgTable("social_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================================
// 10. SYSTEM GOVERNANCE & AUDIT TRAIL
// ============================================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_read_idx").on(table.isRead),
  ],
);

// Reusable modules keep a snapshot so later edits never rewrite a student's work.
export const moduleAssignments = pgTable("module_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull().references(() => learningModules.id, { onDelete: "restrict" }),
  studentId: uuid("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  assignedBy: uuid("assigned_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  content: jsonb("content").$type<ModuleContent>().notNull(),
  moduleVersion: integer("module_version").notNull(),
  status: text("status").$type<ModuleStatus>().notNull().default("ASSIGNED"),
  note: text("note").notNull().default(""),
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
  version: integer("version").notNull().default(1),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("module_assignments_student_module_unique").on(t.studentId, t.moduleId),
  index("module_assignments_module_status_idx").on(t.moduleId, t.status, t.startedAt),
  index("module_assignments_student_idx").on(t.studentId),
  check("module_assignment_lifecycle", sql`(${t.status} = 'ASSIGNED' AND ${t.startedAt} IS NULL AND ${t.completedAt} IS NULL) OR (${t.status} = 'IN_PROGRESS' AND ${t.startedAt} IS NOT NULL AND ${t.completedAt} IS NULL) OR (${t.status} = 'COMPLETED' AND ${t.startedAt} IS NOT NULL AND ${t.completedAt} IS NOT NULL AND ${t.completedAt} >= ${t.startedAt})`),
]);

// ============================================================
// 11. EMPLOYABILITY SKILLS TRAINING & EDUCATIONAL MATERIALS
// ============================================================

export const employabilityResources = pgTable(
  "employability_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    resourceType: text("resource_type").notNull().default("DOCUMENT"),
    resourceAddress: text("resource_address").notNull(),
    uploaderUserId: uuid("uploader_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    uploaderName: text("uploader_name").notNull(),
    uploaderRole: text("uploader_role").notNull().default("Career Officer"),
    uploaderAvatarUrl: text("uploader_avatar_url"),
    uploaderBio: text("uploader_bio"),
    uploaderLinkedIn: text("uploader_linkedin"),
    whyShared: text("why_shared").notNull(),
    howToUse: text("how_to_use").notNull(),
    targetAudience: text("target_audience").notNull().default("All Students"),
    isPublished: boolean("is_published").notNull().default(true),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("employability_resources_cat_idx").on(table.category),
    index("employability_resources_uploader_idx").on(table.uploaderUserId),
    index("employability_resources_published_idx").on(table.isPublished),
  ],
);

// ============================================================
// 12. STUDENT ACADEMIC DOSSIER, OCCURRENCES & MILESTONES
// ============================================================

export const studentOccurrences = pgTable(
  "student_occurrences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorName: text("actor_name").notNull().default("Career Staff"),
    category: text("category").notNull(), // "ACHIEVEMENT", "IMPROVEMENT", "COUNSELING_NOTE", "OCCURRENCE", "ASSESSMENT_RESULT"
    title: text("title").notNull(),
    description: text("description").notNull(),
    actionTaken: text("action_taken"),
    occurrenceDate: timestamp("occurrence_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("student_occurrences_student_idx").on(table.studentId),
    index("student_occurrences_category_idx").on(table.category),
    index("student_occurrences_date_idx").on(table.occurrenceDate),
  ],
);

// ============================================================
// 13. VIRTUAL INTERNSHIPS & STUDENT WORK SIMULATIONS
// ============================================================

export const virtualInternships = pgTable(
  "virtual_internships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    organizationName: text("organization_name").notNull(),
    department: text("department").notNull().default("ALL"),
    level: text("level").notNull().default("ALL"),
    duration: text("duration").notNull().default("4 Weeks"),
    difficulty: text("difficulty").notNull().default("INTERMEDIATE"), // BEGINNER, INTERMEDIATE, ADVANCED
    bannerUrl: text("banner_url"),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    learningObjectives: jsonb("learning_objectives").$type<string[]>().notNull().default([]),
    tasksDeliverables: jsonb("tasks_deliverables").$type<Array<{
      id: string;
      title: string;
      description: string;
      deliverableType: string;
    }>>().notNull().default([]),
    skills: text("skills"),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("virtual_internships_slug_idx").on(table.slug),
    index("virtual_internships_dept_idx").on(table.department),
    index("virtual_internships_pub_idx").on(table.isPublished),
  ],
);

export const virtualInternshipEnrollments = pgTable(
  "virtual_internship_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internshipId: uuid("internship_id")
      .notNull()
      .references(() => virtualInternships.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    assignedByUserId: uuid("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    assignmentNote: text("assignment_note"),
    status: text("status", {
      enum: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REVISION_REQUESTED"],
    })
      .notNull()
      .default("ASSIGNED"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    staffFeedback: text("staff_feedback"),
    gradeScore: text("grade_score"),
    outcomeType: text("outcome_type").notNull().default("TEXT"), // TEXT, URL, VIDEO, FILE, HYBRID
    outcomeTitle: text("outcome_title"),
    outcomeText: text("outcome_text"),
    outcomeUrl: text("outcome_url"), // Web, GitHub, Loom, YouTube
    outcomeFileUrl: text("outcome_file_url"), // Document, PDF, Image
    outcomeFileName: text("outcome_file_name"),
    outcomeMetadata: jsonb("outcome_metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("student_internship_unique").on(table.studentId, table.internshipId),
    index("internship_enrollments_student_idx").on(table.studentId),
    index("internship_enrollments_internship_idx").on(table.internshipId),
    index("internship_enrollments_status_idx").on(table.status),
  ],
);

export type StudentMasterRecord = typeof studentMasterList.$inferSelect;
export type NewStudentMasterRecord = typeof studentMasterList.$inferInsert;
export type VirtualInternshipRecord = typeof virtualInternships.$inferSelect;
export type VirtualInternshipEnrollmentRecord = typeof virtualInternshipEnrollments.$inferSelect;

// ============================================================
// 14. PARTNER EMPLOYERS & CORPORATE ORGANIZATIONS
// ============================================================

export const partnerEmployers = pgTable(
  "partner_employers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    industry: text("industry").notNull().default("Technology"),
    partnershipTier: text("partnership_tier", {
      enum: ["STRATEGIC", "MOA_SIGNED", "RECRUITING_PARTNER", "AFFILIATE"],
    })
      .notNull()
      .default("RECRUITING_PARTNER"),
    contactPerson: text("contact_person"),
    contactDesignation: text("contact_designation"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    officialEmail: text("official_email"),
    registrationNumber: text("registration_number"),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    verificationStatus: text("verification_status", {
      enum: ["PENDING", "VERIFIED", "SUSPENDED"],
    })
      .notNull()
      .default("VERIFIED"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedByUserId: uuid("verified_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    trustBadges: jsonb("trust_badges").$type<string[]>().notNull().default([]),
    address: text("address"),
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("partner_employers_slug_idx").on(table.slug),
    index("partner_employers_industry_idx").on(table.industry),
    index("partner_employers_tier_idx").on(table.partnershipTier),
    index("partner_employers_user_idx").on(table.userId),
    index("partner_employers_verif_idx").on(table.verificationStatus),
  ],
);

// ============================================================
// 15. JOB BOARD POSTINGS & OPPORTUNITIES
// ============================================================

export const jobPostings = pgTable(
  "job_postings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    employerId: uuid("employer_id").references(() => partnerEmployers.id, {
      onDelete: "set null",
    }),
    companyName: text("company_name").notNull(),
    companyLogoUrl: text("company_logo_url"),
    department: text("department").notNull().default("ALL"),
    natureOfWork: text("nature_of_work").notNull().default("Full-Time"),
    duration: text("duration").notNull().default("Permanent"),
    vacanciesCount: integer("vacancies_count").notNull().default(1),
    salaryRange: text("salary_range"),
    location: text("location").notNull().default("Katsina, Nigeria"),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    requirements: jsonb("requirements").$type<string[]>().notNull().default([]),
    responsibilities: jsonb("responsibilities").$type<string[]>().notNull().default([]),
    skills: text("skills"),
    applicationDeadline: timestamp("application_deadline", { withTimezone: true }),
    contactEmail: text("contact_email"),
    applicationUrl: text("application_url"),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("job_postings_slug_idx").on(table.slug),
    index("job_postings_employer_idx").on(table.employerId),
    index("job_postings_dept_idx").on(table.department),
    index("job_postings_nature_idx").on(table.natureOfWork),
    index("job_postings_pub_idx").on(table.isPublished),
  ],
);

// ============================================================
// 16. EMPLOYER ENGAGEMENT, JOB RECOMMENDATIONS & SUPERVISION
// ============================================================

export const jobRecommendations = pgTable(
  "job_recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobPostings.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    recommendedByUserId: uuid("recommended_by_user_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    recommenderName: text("recommender_name").notNull().default("Career Staff"),
    recommenderDesignation: text("recommender_designation"),
    recommendationReason: text("recommendation_reason").notNull(),
    supervisorUserId: uuid("supervisor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    supervisorName: text("supervisor_name"),
    status: text("status", {
      enum: ["RECOMMENDED", "APPLIED", "IN_PROGRESS", "COMPLETED", "TERMINATED"],
    })
      .notNull()
      .default("RECOMMENDED"),
    supervisionNotes: text("supervision_notes"),
    statusUpdateReason: text("status_update_reason"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    performanceRating: integer("performance_rating"),
    employerFeedback: text("employer_feedback"),
    employerStatus: text("employer_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("job_student_recommendation_unique").on(table.jobId, table.studentId),
    index("job_rec_job_idx").on(table.jobId),
    index("job_rec_student_idx").on(table.studentId),
    index("job_rec_recommender_idx").on(table.recommendedByUserId),
    index("job_rec_supervisor_idx").on(table.supervisorUserId),
    index("job_rec_status_idx").on(table.status),
  ],
);

export type PartnerEmployerRecord = typeof partnerEmployers.$inferSelect;
export type JobPostingRecord = typeof jobPostings.$inferSelect;
export type JobRecommendationRecord = typeof jobRecommendations.$inferSelect;

