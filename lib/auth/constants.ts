// Shared, dependency-free auth constants.
// Safe to import from Edge middleware (no Prisma / node:crypto here).

// Name of the cookie that carries the raw session token.
export const SESSION_COOKIE = "orbit_session";
