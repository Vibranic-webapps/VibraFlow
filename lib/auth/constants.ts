// Shared, dependency-free auth constants.
// Safe to import from Edge middleware (no Prisma / node:crypto here).

// Name of the cookie that carries the raw session token.
export const SESSION_COOKIE = "orbit_session";

// Minimum password length. The one source for the server rule
// (lib/auth/password.ts) and the hints/checks in the auth forms.
export const MIN_PASSWORD_LENGTH = 8;
