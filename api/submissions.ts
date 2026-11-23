import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_db.js';
import { verify, decode } from '@tsndr/cloudflare-worker-jwt';
import crypto from 'node:crypto';
import { getJwtSecret } from './_auth.js';

// Captcha tokens are single-use: each token's id is recorded here the first
// time it's used. Rows are only needed until the token expires (5 minutes).
let usedTableReady: Promise<unknown> | null = null;
const ensureUsedCaptchaTable = () => {
  if (!usedTableReady) {
    usedTableReady = query(
      `CREATE TABLE IF NOT EXISTS used_captcha_tokens (
         jti TEXT PRIMARY KEY,
         expires_at TIMESTAMPTZ NOT NULL
       )`
    ).catch((err) => {
      usedTableReady = null;
      throw err;
    });
  }
  return usedTableReady;
};

// Returns true the first time a token id is seen, false on any reuse.
async function claimCaptchaToken(jti: string, exp: number): Promise<boolean> {
  await ensureUsedCaptchaTable();
  const { rowCount } = await query(
    `INSERT INTO used_captcha_tokens (jti, expires_at)
     VALUES ($1, to_timestamp($2))
     ON CONFLICT (jti) DO NOTHING`,
    [jti, exp]
  );
  // Housekeeping: expired ids can't be replayed anyway.
  query('DELETE FROM used_captcha_tokens WHERE expires_at < NOW()').catch(() => {});
  return rowCount === 1;
}

function getRealIP(req: VercelRequest): string | null {
  // Priority order: CF-Connecting-IP (Cloudflare), X-Real-IP, X-Forwarded-For, socket
  return (
    (req.headers['cf-connecting-ip'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    null
  );
}

const mapSubmission = (row: any) => ({
  id: row.id,
  address: row.address,
  additionalInfo: row.additional_info,
  status: row.status,
  createdAt: row.created_at,
  ipAddress: row.ip_address,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, additionalInfo, captchaAnswer, captchaToken } = req.body || {};

  // Validate required fields
  if (!address || captchaAnswer === undefined || !captchaToken) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify JWT token signature and expiration
    const isValid = await verify(captchaToken, getJwtSecret());

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired captcha token' });
    }

    // Decode JWT to get payload
    const payload = decode(captchaToken).payload as { answer: number; exp: number; jti?: string };

    // Check if captcha answer is correct
    if (payload.answer !== parseInt(captchaAnswer)) {
      return res.status(400).json({ error: 'Incorrect captcha answer' });
    }

    // Each solved captcha may only be used once.
    if (!payload.jti || !(await claimCaptchaToken(payload.jti, payload.exp))) {
      return res.status(400).json({ error: 'This security check was already used. Please answer the new question.' });
    }

    // Generate submission ID
    const id = `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    // Extract IP address
    const ip = getRealIP(req);

    // Extract user agent
    const userAgent = req.headers['user-agent'] || null;

    // Insert submission into database
    const insertQuery = `
      INSERT INTO location_submissions (id, address, additional_info, status, created_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const { rows } = await query(insertQuery, [
      id,
      address.trim(),
      additionalInfo?.trim() || null,
      'pending',
      now,
      ip,
      userAgent,
    ]);

    res.status(201).json(mapSubmission(rows[0]));
  } catch (error) {
    console.error('Failed to create submission', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
}
