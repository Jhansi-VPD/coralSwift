import { NextRequest } from 'next/server';

export const SESSION_COOKIE_NAME = 'coralswift_admin_session';
const SESSION_SECRET = process.env.ADMIN_PASSWORD || 'coralswift_enterprise_secure_session_secret_2026';

/**
 * Creates a cryptographically signed HMAC token for admin session
 */
export async function createSessionToken(email: string): Promise<string> {
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
  if (!token) return { valid: false };

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

/**
 * Helper to authenticate incoming NextRequest for API route handlers
 */
export async function isAuthenticatedRequest(request: NextRequest): Promise<boolean> {
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) {
    const result = await verifySessionToken(cookieToken);
    if (result.valid) return true;
  }

  // Also check Authorization header for Bearer token
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7);
    const result = await verifySessionToken(bearerToken);
    if (result.valid) return true;
  }

  return false;
}
