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
} from "drizzle-orm/pg-core";

// ============================================================
// 1. CORE IDENTITY, ROLES & SESSIONS
// ============================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["STUDENT", "STAFF", "SUPER_ADMIN"] })
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

export const studentProfiles = pgTable(
  "student_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    regNumber: text("reg_number").notNull().unique(),
    fullName: text("full_name").notNull(),
    department: text("department"),
    level: text("level"),
    phone: text("phone"),
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
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
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
      enum: ["IN_PROGRESS", "SUBMITTED", "REVIEWED"],
    })
      .notNull()
      .default("IN_PROGRESS"),
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
