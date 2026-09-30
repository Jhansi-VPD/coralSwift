/**
 * SESSION VERIFICATION ARCHITECTURE
 *
 * There are TWO independent verifySessionToken() implementations:
 *
 * 1. This file (lib/auth.ts) — Node.js runtime (API route handlers)
 *    Uses Buffer.from() for base64url encoding/decoding.
 *
 * 2. middleware.ts — Edge Runtime (Next.js middleware)
 *    Uses atob() with manual base64url character replacement.
 *
 * They MUST remain separate because:
 *   - auth.ts uses Buffer.from().toString('base64url') which requires Node.js
 *   - middleware.ts runs in Edge Runtime where Buffer base64url is unreliable
 *   - Both implementations use the same HMAC algorithm and session secret
 *
 * isAuthenticatedRequest() was removed — it was dead code (never imported).
 * Admin request authorization is handled by middleware.ts at the HTTP level.
 */

export const SESSION_COOKIE_NAME = 'coralswift_admin_session';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

/**
 * Creates a cryptographically signed HMAC token for admin session
 */
export async function createSessionToken(email: string): Promise<string> {
  if (!SESSION_SECRET) {
    throw new Error('ADMIN_SESSION_SECRET environment variable is required');
  }

  const encoder = new TextEncoder();
  const timestamp = Date.now();
  const payload = JSON.stringify({ email, timestamp });
  const payloadB64 = Buffer.from(payload).toString('base64url');

  const keyData = encoder.encode(SESSION_SECRET);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(payloadB64)
  );

  const signatureB64 = Buffer.from(signature).toString('base64url');
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies the HMAC token signature and expiration (max 7 days)
 */
export async function verifySessionToken(token?: string | null): Promise<{ valid: boolean; email?: string }> {
  if (!token || !SESSION_SECRET) return { valid: false };

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();

    const keyData = encoder.encode(SESSION_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Buffer.from(signatureB64, 'base64url');
    const isValidSignature = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes,
      encoder.encode(payloadB64)
    );

    if (!isValidSignature) return { valid: false };

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const { email, timestamp } = JSON.parse(payloadJson);

    // Expire session after 7 days
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAgeMs) {
      return { valid: false };
    }

    return { valid: true, email };
  } catch (err) {
    return { valid: false };
  }
}
