import { sign, verify } from '@tsndr/cloudflare-worker-jwt';
import { Env } from './types';

export async function createJWT(payload: Record<string, any>, secret: string): Promise<string> {
  const token = await sign({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  }, secret);
  return token;
}

export async function verifyJWT(authHeader: string | null, secret: string): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);

  try {
    const isValid = await verify(token, secret);
    return isValid;
  } catch (error) {
    console.error('JWT verification error:', error);
    return false;
  }
}

export function jsonResponse(data: any, status: number = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers
    }
  });
}

export function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ error: message }, status);
}
