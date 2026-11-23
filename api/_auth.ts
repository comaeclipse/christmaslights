import { sign, verify } from '@tsndr/cloudflare-worker-jwt';

// The secret that signs admin logins and captcha tokens. There is deliberately
// no fallback: a default value would be public (this repo is public) and would
// let anyone forge admin tokens. If it's missing, endpoints fail closed.
export class MissingSecretError extends Error {}

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'change-me-secret') {
    throw new MissingSecretError('JWT_SECRET is not set. Add it in the Vercel dashboard and redeploy.');
  }
  return secret;
};

export async function createJWT(payload: Record<string, unknown>) {
  // 24h expiry
  const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  return sign({ ...payload, exp }, getJwtSecret());
}

export async function verifyJWT(authHeader?: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    return await verify(authHeader.slice(7), getJwtSecret());
  } catch (error) {
    console.error('JWT verification error:', error);
    return false;
  }
}
