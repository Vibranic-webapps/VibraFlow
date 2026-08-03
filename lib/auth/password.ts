import bcrypt from "bcryptjs";

// Cost factor: how many rounds bcrypt runs. Higher = slower to compute =
// harder to brute-force. 10-12 is the standard sweet spot.
const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password before storing it.
 * bcrypt generates a random salt and embeds it inside the returned string,
 * so we never store or manage the salt separately.
 */
export function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Check a plaintext password against a stored bcrypt hash.
 * Returns true only if they match.
 */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}
