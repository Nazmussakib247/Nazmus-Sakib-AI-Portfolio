import {
  mysqlTable,
  mysqlEnum,
  varchar,
  text,
  timestamp,
  int,
  json,
  boolean,
  date,
  longtext,
} from "drizzle-orm/mysql-core";

// Auth users table (existing)
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
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
  age: int("age"),
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
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  techStack: json("tech_stack").$type<string[]>(),
  thumbnailUrl: text("thumbnail_url"),
  githubUrl: text("github_url"),
  liveUrl: text("live_url"),
  videoUrl: text("video_url"),
  screenshots: json("screenshots").$type<string[]>(),
  // Optional flagship case-study content. JSON collections use stable ordered shapes validated at the API boundary.
  slug: varchar("slug", { length: 255 }).unique(),
  caseStudyEnabled: boolean("case_study_enabled").default(false),
  caseStudySummary: text("case_study_summary"),
  problemStatement: text("problem_statement"),
  roleDescription: text("role_description"),
  architectureSummary: text("architecture_summary"),
  outcomeSummary: text("outcome_summary"),
  lessonsLearned: text("lessons_learned"),
  caseStudyOrder: int("case_study_order").default(0),
  caseStudyArchitecture: json("case_study_architecture").$type<CaseStudyArchitectureNode[]>(),
  caseStudyDecisions: json("case_study_decisions").$type<CaseStudyDecision[]>(),
  caseStudyMetrics: json("case_study_metrics").$type<CaseStudyMetric[]>(),
  caseStudyMedia: json("case_study_media").$type<CaseStudyMedia[]>(),
  caseStudyLinks: json("case_study_links").$type<CaseStudyLink[]>(),
  caseStudyStack: json("case_study_stack").$type<string[]>(),
  orderIndex: int("order_index").default(0),
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
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  issuer: varchar("issuer", { length: 255 }).notNull(),
  thumbnailUrl: text("thumbnail_url"),
  credentialUrl: text("credential_url"),
  skillsGained: json("skills_gained").$type<string[]>(),
  description: text("description"),
  category: varchar("category", { length: 100 }).default("General"),
  issueDate: date("issue_date"),
  orderIndex: int("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Certificate = typeof certificates.$inferSelect;

// Experiences table
export const experiences = mysqlTable("experiences", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["education", "work", "internship"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  organization: varchar("organization", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  startDate: varchar("start_date", { length: 50 }),
  endDate: varchar("end_date", { length: 50 }),
  description: text("description"),
  orderIndex: int("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Experience = typeof experiences.$inferSelect;

// Awards table
export const awards = mysqlTable("awards", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eyebrow: varchar("eyebrow", { length: 255 }),
  image: text("image"),
  imageAlt: varchar("image_alt", { length: 255 }),
  sourceUrl: text("source_url"),
  sourceLabel: varchar("source_label", { length: 255 }),
  iconName: varchar("icon_name", { length: 100 }).default("award"),
  orderIndex: int("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Award = typeof awards.$inferSelect;

// Writings/Blog articles table
export const writings = mysqlTable("writings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  category: varchar("category", { length: 100 }),
  coverImageUrl: text("cover_image_url"),
  externalUrl: text("external_url"),
  platform: mysqlEnum("platform", ["medium", "pdf", "blogspot"]).default("medium"),
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  orderIndex: int("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Writing = typeof writings.$inferSelect;

// Admin authentication tables
// The token column stores a SHA-256 digest; the raw bearer token is only sent in the HttpOnly cookie.
export const adminSessions = mysqlTable("admin_sessions", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminSession = typeof adminSessions.$inferSelect;

export const adminCredentials = mysqlTable("admin_credentials", {
  id: int("id").autoincrement().primaryKey(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;

export const adminLoginAttempts = mysqlTable("admin_login_attempts", {
  id: int("id").autoincrement().primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull().unique(),
  failedCount: int("failed_count").default(0).notNull(),
  firstFailedAt: timestamp("first_failed_at").defaultNow().notNull(),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow().notNull(),
  blockedUntil: timestamp("blocked_until"),
});

export type AdminLoginAttempt = typeof adminLoginAttempts.$inferSelect;

export const adminPasswordResets = mysqlTable("admin_password_resets", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: varchar("code_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: int("attempts").default(0).notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminPasswordReset = typeof adminPasswordResets.$inferSelect;

// Skills table
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  iconName: varchar("icon_name", { length: 100 }).default("code"),
  iconUrl: text("icon_url"),
  name: varchar("name", { length: 100 }).notNull(),
  level: int("level").default(80), // 0-100 proficiency
  orderIndex: int("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Skill = typeof skills.$inferSelect;

// Contact messages table
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;

// Site settings key-value store
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// Uploaded files (images/PDFs) stored in DB as base64
export const uploads = mysqlTable("uploads", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: int("size").notNull(),
  data: longtext("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Upload = typeof uploads.$inferSelect;
