import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { serveCvDownload, serveFavicon, serveSocialPreviewImage, serveUploadedFile } from "./lib/files";
import { serveSitemap } from "./lib/sitemap";
import { syncMediumWritings } from "./routers/writing";
import { ensureCvEventsTable, ensureVisitEventsTable } from "./routers/analytics";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  if (env.isProduction) {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  await next();
});

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.get("/og-image.png", serveSocialPreviewImage);
app.get("/favicon.png", serveFavicon);
app.get("/sitemap.xml", serveSitemap);
app.get("/api/cv/download", serveCvDownload);
app.get("/api/files/:id", async (c) => {
  c.header("X-Frame-Options", "SAMEORIGIN");
  return serveUploadedFile(c);
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  const runMediumSync = () => syncMediumWritings().then((result) => console.log(`[medium-sync] ${result.created} new, ${result.updated} updated`)).catch((error) => console.error('[medium-sync] failed', error));
  void ensureVisitEventsTable();
  void ensureCvEventsTable();
  void runMediumSync();
  setInterval(runMediumSync, 1000 * 60 * 60 * 6);
}
