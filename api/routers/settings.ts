import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { siteSettings } from "@db/schema";
import { eq } from "drizzle-orm";
import { recordSiteSettingsChange, snapshotSiteSettings } from "./change-log";
import { normalizeSeoSetting } from "../lib/seo";

/**
 * Site settings — a key/value store powering admin-editable site chrome:
 *   heroHeadline, heroTagline, heroSubtext, heroBadge,
 *   sectionVisibility (JSON), seoTitle, seoDescription,
 *   footerText, availableForWork ("true"/"false"), availabilityText
 */

const PRIVATE_SETTING_KEYS = new Set(['aiProvider', 'aiApiKey', 'aiApiUrl', 'aiModel']);
type AiProvider = 'gemini' | 'groq' | 'xai' | 'openai';
const settingColumns = { key: siteSettings.key, value: siteSettings.value };

export const settingsRouter = createRouter({
  getAll: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select(settingColumns).from(siteSettings);
    const map: Record<string, string> = {};
    for (const row of rows) {
      if (row.value !== null && !PRIVATE_SETTING_KEYS.has(row.key)) map[row.key] = normalizeSeoSetting(row.key, row.value);
    }
    return map;
  }),
});

export const settingsAdminRouter = createAdminRouter({
  getAi: adminProcedure.query(async () => {
    const db = getDb();
    const rows = await db.select(settingColumns).from(siteSettings);
    const values = Object.fromEntries(rows.filter((row) => PRIVATE_SETTING_KEYS.has(row.key)).map((row) => [row.key, row.value || '']));
    const key = values.aiApiKey || '';
    const provider = (values.aiProvider || (values.aiApiUrl?.includes('generativelanguage.googleapis.com') ? 'gemini' : values.aiApiUrl?.includes('api.groq.com') ? 'groq' : values.aiApiUrl?.includes('api.x.ai') ? 'xai' : 'openai')) as AiProvider;
    const defaults = { gemini: { apiUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-3.5-flash-lite' }, groq: { apiUrl: 'https://api.groq.com/openai', model: 'llama-3.3-70b-versatile' }, xai: { apiUrl: 'https://api.x.ai', model: 'grok-3-mini' }, openai: { apiUrl: 'https://api.openai.com', model: 'gpt-5-mini' } }[provider];
    return { provider, apiUrl: values.aiApiUrl || defaults.apiUrl, model: values.aiModel || defaults.model, hasKey: Boolean(key), maskedKey: key ? `${key.slice(0, 7)}••••${key.slice(-4)}` : '' };
  }),

  setAi: adminProcedure
    .input(z.object({ provider: z.enum(['openai', 'gemini', 'groq', 'xai']).default('gemini'), apiUrl: z.string().url(), model: z.string().min(1).max(100), apiKey: z.string().max(500).optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const currentRows = await db.select(settingColumns).from(siteSettings);
      const currentKey = currentRows.find((row) => row.key === 'aiApiKey')?.value || '';
      const values = { aiProvider: input.provider, aiApiUrl: input.apiUrl, aiModel: input.model, aiApiKey: input.apiKey?.trim() || currentKey };
      for (const [key, value] of Object.entries(values)) {
        const existing = currentRows.find((row) => row.key === key);
        if (existing) await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
        else await db.insert(siteSettings).values({ key, value });
      }
      return { success: true };
    }),

  set: adminProcedure
    .input(z.object({ key: z.string().min(1).max(100), value: z.string() }))
    .mutation(async ({ input }) => {
      const beforeState = await snapshotSiteSettings();
      const db = getDb();
      const existing = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, input.key))
        .limit(1);
      if (existing.length > 0) {
        await db
          .update(siteSettings)
          .set({ value: input.value })
          .where(eq(siteSettings.key, input.key));
      } else {
        await db.insert(siteSettings).values(input);
      }
      const afterState = await snapshotSiteSettings();
      await recordSiteSettingsChange(beforeState, afterState, `Updated site setting: ${input.key}`);
      return { success: true };
    }),

  setMany: adminProcedure
    .input(z.array(z.object({ key: z.string().min(1).max(100), value: z.string() })))
    .mutation(async ({ input }) => {
      const beforeState = await snapshotSiteSettings();
      const db = getDb();
      for (const { key, value } of input) {
        const existing = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, key))
          .limit(1);
        if (existing.length > 0) {
          await db
            .update(siteSettings)
            .set({ value })
            .where(eq(siteSettings.key, key));
        } else {
          await db.insert(siteSettings).values({ key, value });
        }
      }
      const afterState = await snapshotSiteSettings();
      await recordSiteSettingsChange(beforeState, afterState, `Updated ${input.length} site settings`);
      return { success: true };
    }),
});
