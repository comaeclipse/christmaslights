import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sign } from '@tsndr/cloudflare-worker-jwt';
import crypto from 'node:crypto';
import { getJwtSecret } from './_auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Every captcha must be unique; never let a CDN/browser reuse one.
  res.setHeader('Cache-Control', 'no-store');

  try {
    // Generate random addition problem
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const answer = num1 + num2;

    // Signed token with the answer, a unique id (so it can only be used once,
    // see api/submissions.ts) and a 5-minute expiration.
    const exp = Math.floor(Date.now() / 1000) + 300;
    const jti = crypto.randomUUID();
    const token = await sign({ answer, exp, jti }, getJwtSecret());

    const question = `${num1} + ${num2} = ?`;

    res.status(200).json({ question, token });
  } catch (error) {
    console.error('Failed to generate captcha', error);
    res.status(500).json({ error: 'Failed to generate captcha' });
  }
}
