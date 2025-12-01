import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createJWT } from '../_auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } =
    typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = await createJWT({ role: 'admin' });
  return res.status(200).json({ token });
}
