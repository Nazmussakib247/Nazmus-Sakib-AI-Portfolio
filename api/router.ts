import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { adminRouter } from "./routers/admin";
import { profileRouter, profileAdminRouter } from "./routers/profile";
import { projectRouter, projectAdminRouter } from "./routers/project";
import { certificateRouter, certificateAdminRouter } from "./routers/certificate";
import { experienceRouter, experienceAdminRouter } from "./routers/experience";
import { awardRouter, awardAdminRouter } from "./routers/award";
import { writingRouter, writingAdminRouter } from "./routers/writing";
import { skillRouter, skillAdminRouter } from "./routers/skill";
import { contactRouter, contactAdminRouter } from "./routers/contact";
import { settingsRouter, settingsAdminRouter } from "./routers/settings";
import { uploadAdminRouter } from "./routers/upload";
import { assistantRouter } from "./routers/assistant";
import { socialRouter } from "./routers/social";
import { analyticsRouter, analyticsAdminRouter } from "./routers/analytics";
import { changeLogAdminRouter } from "./routers/change-log";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  admin: adminRouter,
  profile: profileRouter,
  project: projectRouter,
  certificate: certificateRouter,
  experience: experienceRouter,
  award: awardRouter,
  writing: writingRouter,
  skill: skillRouter,
  contact: contactRouter,
  settings: settingsRouter,
  assistant: assistantRouter,
  social: socialRouter,
  analytics: analyticsRouter,
  // Admin routers under admin prefix
  profileAdmin: profileAdminRouter,
  projectAdmin: projectAdminRouter,
  certificateAdmin: certificateAdminRouter,
  experienceAdmin: experienceAdminRouter,
  awardAdmin: awardAdminRouter,
  writingAdmin: writingAdminRouter,
  skillAdmin: skillAdminRouter,
  contactAdmin: contactAdminRouter,
  settingsAdmin: settingsAdminRouter,
  uploadAdmin: uploadAdminRouter,
  analyticsAdmin: analyticsAdminRouter,
  changeLogAdmin: changeLogAdminRouter,
});

export type AppRouter = typeof appRouter;
