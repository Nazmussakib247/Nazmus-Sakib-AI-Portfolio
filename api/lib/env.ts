import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  // APP_ID identifies the optional Kimi OAuth client. Keep a stable fallback
  // so local/admin session tokens remain valid when Kimi is not configured.
  appId: optional("APP_ID", "nazmus-portfolio"),
  // APP_SECRET signs the application session JWT and remains required in production.
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  // Kimi OAuth is optional; its handler reports a clear error only if invoked
  // without the corresponding configuration.
  kimiAuthUrl: optional("KIMI_AUTH_URL"),
  kimiOpenUrl: optional("KIMI_OPEN_URL"),
  ownerUnionId: optional("OWNER_UNION_ID"),
};
