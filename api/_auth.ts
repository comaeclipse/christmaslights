import { sign, verify } from '@tsndr/cloudflare-worker-jwt';

const DEFAULT_SECRET = 'change-me-secret';

const getJwtSecret = () => process.env.JWT_SECRET || DEFAULT_SECRET;

export async function createJWT(payload: Record<string, unknown>) {
  // 24h expiry to match the Cloudflare functions behavior
  const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  return sign({ ...payload, exp }, getJwtSecret());
}

export async function verifyJWT(authHeader?: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    return verify(authHeader.slice(7), getJwtSecret());
  } catch (error) {
    console.error('JWT verification error:', error);
    return false;
  }
}
