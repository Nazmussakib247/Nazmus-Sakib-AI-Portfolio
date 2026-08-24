# Admin security and hosting checklist

The Admin Panel now uses a database-backed password credential, a salted scrypt password hash, and a short-lived HttpOnly session cookie. The raw password is never returned to the browser or stored in the database. The legacy `adminToken` localStorage flow has been removed from the frontend.

## First production deployment

1. Create the production MariaDB database and configure `DATABASE_URL`.
2. Set a strong, unique `ADMIN_PASSWORD` environment variable before the first admin login. Use at least 12 characters and include uppercase, lowercase, numbers, and symbols. Never commit the real value to Git.
3. Set `ADMIN_EMAIL` to the address that should receive recovery codes. Configure `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` so the server can deliver the message. The existing `CONTACT_TO_EMAIL` is accepted as a fallback recipient address when `ADMIN_EMAIL` is not set.
4. Apply `db/migrations/0001_admin_security.sql` to the production database, or run the project’s Drizzle schema workflow if your deployment already manages the full schema.
5. Deploy behind HTTPS. In production, the admin session cookie is `HttpOnly`, `Secure`, `SameSite=Strict`, and expires after 8 hours.
6. Log in once with the bootstrap password, open **Admin → Security**, and immediately change it. The bootstrap value is then replaced by the database hash; future logins use the database credential.
7. Remove the real bootstrap password from deployment logs and secret history. Keep it only in the hosting provider’s encrypted environment-variable store until the first successful password change.

## Runtime protections

The admin login is throttled per client identifier after five failed attempts within a 15-minute window, with a 15-minute block. Password changes require the current password, enforce the strong-password policy, invalidate every existing admin session, clear the current cookie, and redirect the browser to login. The **Sign out all devices** control also invalidates all sessions. Admin mutations require a valid session and same-origin requests. Password recovery always returns a generic response to avoid revealing whether an email is configured; a valid request creates a six-digit code whose hash is stored for 10 minutes, permits at most five verification attempts, and is deleted after successful use. The code is delivered through Resend when the email variables are configured.

## Hosting requirements

Use HTTPS for the public domain, set `NODE_ENV=production`, keep `DATABASE_URL`, `APP_SECRET`, and `ADMIN_PASSWORD` in the host’s secret manager, and do not expose them as `VITE_*` variables. Restrict database network access to the application host where possible, enable automated database backups, and monitor authentication errors. If the frontend and API are deployed on different origins, keep them on the same site or explicitly configure the cookie and CORS policy before production; the default project configuration assumes the app and `/api` share one origin.

## Recovery

If the password is lost, do not add a new password to frontend code. Set a new temporary `ADMIN_PASSWORD` in the production secret manager only when the credential table is empty, or reset the single row through a controlled database maintenance procedure using the server-side password hashing helper. After access is restored, immediately change the password again from **Admin → Security** and rotate the affected deployment secrets.

## Forgot-password recovery

The login page links to `/admin/recover`. The flow asks for the admin email, sends a generic response, and—when the address matches `ADMIN_EMAIL` (or `CONTACT_TO_EMAIL` fallback) and Resend is configured—delivers a six-digit code. The code is stored only as a hash, expires after 10 minutes, is limited to five attempts, and is deleted after a successful reset. The reset form enforces the same strong password policy and invalidates all active admin sessions.
