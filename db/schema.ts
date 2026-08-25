import {
  pgTable,
  pgEnum,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  date,
} from "drizzle-orm/pg-core";

const roleEnum = pgEnum("user_role", ["user", "admin"]);
const experienceTypeEnum = pgEnum("experience_type", ["education", "work", "internship"]);
const platformEnum = pgEnum("writing_platform", ["medium", "pdf", "blogspot"]);

// Auth users table (existing)
export const users = pgTable("users", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Profile table (single row)
export const profiles = pgTable("profiles", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  bio: text("bio").notNull(),
  avatarUrl: text("avatar_url"),
  cvUrl: text("cv_url"),
  email: varchar("email", { length: 320 }),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  mediumUrl: text("medium_url"),
  location: varchar("location", { length: 255 }),
  age: integer("age"),
  university: varchar("university", { length: 255 }),
  department: varchar("department", { length: 255 }),
  semester: varchar("semester", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Profile = typeof profiles.$inferSelect;

// Projects table
export const projects = pgTable("projects", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  techStack: jsonb("tech_stack").$type<string[]>(),
  thumbnailUrl: text("thumbnail_url"),
  githubUrl: text("github_url"),
  liveUrl: text("live_url"),
  videoUrl: text("video_url"),
  screenshots: jsonb("screenshots").$type<string[]>(),
  // Optional flagship case-study content. JSON collections use stable ordered shapes validated at the API boundary.
  slug: varchar("slug", { length: 255 }).unique(),
  caseStudyEnabled: boolean("case_study_enabled").default(false),
  caseStudySummary: text("case_study_summary"),
  problemStatement: text("problem_statement"),
  roleDescription: text("role_description"),
  architectureSummary: text("architecture_summary"),
  outcomeSummary: text("outcome_summary"),
  lessonsLearned: text("lessons_learned"),
  caseStudyOrder: integer("case_study_order").default(0),
  caseStudyArchitecture: jsonb("case_study_architecture").$type<CaseStudyArchitectureNode[]>(),
  caseStudyDecisions: jsonb("case_study_decisions").$type<CaseStudyDecision[]>(),
  caseStudyMetrics: jsonb("case_study_metrics").$type<CaseStudyMetric[]>(),
  caseStudyMedia: jsonb("case_study_media").$type<CaseStudyMedia[]>(),
  caseStudyLinks: jsonb("case_study_links").$type<CaseStudyLink[]>(),
  caseStudyStack: jsonb("case_study_stack").$type<string[]>(),
  orderIndex: integer("order_index").default(0),
  isFeatured: boolean("is_featured").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CaseStudyArchitectureNode = { id: string; label: string; detail?: string; orderIndex: number };
export type CaseStudyDecision = { title: string; decision: string; tradeoff: string; orderIndex: number };
export type CaseStudyMetric = { label: string; value: string; unit?: string; context: string; sourceNote?: string; isVerified: boolean; orderIndex: number };
export type CaseStudyMedia = { url: string; altText: string; caption: string; kind: "overview" | "workflow" | "analysis" | "architecture"; orderIndex: number; thumbnailUrl?: string };
export type CaseStudyLink = { label: string; url: string; kind?: string; orderIndex: number };
export type Project = typeof projects.$inferSelect;

// Certificates table
export const certificates = pgTable("certificates", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  issuer: varchar("issuer", { length: 255 }).notNull(),
  thumbnailUrl: text("thumbnail_url"),
  credentialUrl: text("credential_url"),
  skillsGained: jsonb("skills_gained").$type<string[]>(),
  description: text("description"),
  category: varchar("category", { length: 100 }).default("General"),
  issueDate: date("issue_date"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Certificate = typeof certificates.$inferSelect;

// Experiences table
export const experiences = pgTable("experiences", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  type: experienceTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  organization: varchar("organization", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  startDate: varchar("start_date", { length: 50 }),
  endDate: varchar("end_date", { length: 50 }),
  description: text("description"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Experience = typeof experiences.$inferSelect;

// Awards table
export const awards = pgTable("awards", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eyebrow: varchar("eyebrow", { length: 255 }),
  image: text("image"),
  imageAlt: varchar("image_alt", { length: 255 }),
  sourceUrl: text("source_url"),
  sourceLabel: varchar("source_label", { length: 255 }),
  iconName: varchar("icon_name", { length: 100 }).default("award"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Award = typeof awards.$inferSelect;

// Writings/Blog articles table
export const writings = pgTable("writings", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  category: varchar("category", { length: 100 }),
  coverImageUrl: text("cover_image_url"),
  externalUrl: text("external_url"),
  platform: platformEnum("platform").default("medium"),
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Writing = typeof writings.$inferSelect;

// Admin authentication tables
// The token column stores a SHA-256 digest; the raw bearer token is only sent in the HttpOnly cookie.
export const adminSessions = pgTable("admin_sessions", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminSession = typeof adminSessions.$inferSelect;

export const adminCredentials = pgTable("admin_credentials", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;

export const adminLoginAttempts = pgTable("admin_login_attempts", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull().unique(),
  failedCount: integer("failed_count").default(0).notNull(),
  firstFailedAt: timestamp("first_failed_at").defaultNow().notNull(),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow().notNull(),
  blockedUntil: timestamp("blocked_until"),
});

export type AdminLoginAttempt = typeof adminLoginAttempts.$inferSelect;

export const adminPasswordResets = pgTable("admin_password_resets", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: varchar("code_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminPasswordReset = typeof adminPasswordResets.$inferSelect;

// Skills table
export const skills = pgTable("skills", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  iconName: varchar("icon_name", { length: 100 }).default("code"),
  iconUrl: text("icon_url"),
  name: varchar("name", { length: 100 }).notNull(),
  level: integer("level").default(80), // 0-100 proficiency
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Skill = typeof skills.$inferSelect;

// Contact messages table
export const contactMessages = pgTable("contact_messages", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  message: text("message").notNull(),
  // Server-derived abuse-monitoring metadata. These fields are returned only through admin procedures.
  ipAddress: varchar("ip_address", { length: 128 }),
  userAgent: varchar("user_agent", { length: 500 }),
  deviceType: varchar("device_type", { length: 32 }),
  browser: varchar("browser", { length: 80 }),
  operatingSystem: varchar("operating_system", { length: 80 }),
  isSpam: boolean("is_spam").default(false).notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;

export const blockedContactIps = pgTable("blocked_contact_ips", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  ipAddress: varchar("ip_address", { length: 128 }).notNull().unique(),
  note: varchar("note", { length: 255 }),
  blockedAt: timestamp("blocked_at").defaultNow().notNull(),
});

export const contactRateLimits = pgTable("contact_rate_limits", {
  ipAddress: varchar("ip_address", { length: 128 }).primaryKey(),
  windowStartedAt: timestamp("window_started_at").defaultNow().notNull(),
  messageCount: integer("message_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Site settings key-value store
export const siteSettings = pgTable("site_settings", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// Visit analytics. Raw IP access is restricted to authenticated admins and retention is bounded.
export const visitEvents = pgTable("visit_events", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  ipAddress: varchar("ip_address", { length: 128 }).notNull(),
  country: varchar("country", { length: 2 }).default("ZZ").notNull(),
  path: varchar("path", { length: 160 }).default("/").notNull(),
  referrerHost: varchar("referrer_host", { length: 255 }),
  userAgent: varchar("user_agent", { length: 500 }),
  isSuspicious: boolean("is_suspicious").default(false).notNull(),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
});

export type VisitEvent = typeof visitEvents.$inferSelect;

// Uploaded files (images/PDFs) stored in DB as base64
export const uploads = pgTable("uploads", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  filename: varchar("filename", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Upload = typeof uploads.$inferSelect;
